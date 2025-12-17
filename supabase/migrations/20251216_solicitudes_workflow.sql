-- =====================================================
-- MIGRACIÓN: Sistema de Workflow de Solicitudes
-- Fecha: 2025-12-16
-- Descripción: Modifica tabla solicitudes y crea tablas
--              para el flujo de estados completo
-- =====================================================

-- =====================================================
-- MODIFICAR TABLA SOLICITUDES
-- =====================================================

-- Agregar nuevos campos a la tabla solicitudes
ALTER TABLE public.solicitudes
  -- Información básica del proyecto
  ADD COLUMN IF NOT EXISTS nombre_proyecto TEXT,
  ADD COLUMN IF NOT EXISTS tipo_solicitud TEXT CHECK (tipo_solicitud IN (
    'diplomado_proyeccion_social',
    'diplomado_extension',
    'contrato',
    'convenio'
  )),
  
  -- Actualizar campo estado con nuevos valores
  DROP CONSTRAINT IF EXISTS solicitudes_status_check,
  ADD CONSTRAINT solicitudes_estado_check CHECK (status IN (
    'nuevo',
    'recibido',
    'en_comite',
    'observado',
    'aprobado',
    'rechazado',
    -- Mantener compatibilidad con estados antiguos
    'pendiente',
    'en_revision',
    'completado'
  )),
  
  -- Relaciones con usuarios y comités
  ADD COLUMN IF NOT EXISTS director_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS comite_id UUID REFERENCES public.user_groups(id),
  ADD COLUMN IF NOT EXISTS coordinador_id UUID REFERENCES auth.users(id),
  
  -- Rutas de documentos en storage
  ADD COLUMN IF NOT EXISTS ficha_tecnica_path TEXT,
  ADD COLUMN IF NOT EXISTS formato_003_path TEXT,
  ADD COLUMN IF NOT EXISTS contrato_path TEXT,
  ADD COLUMN IF NOT EXISTS convenio_path TEXT,
  ADD COLUMN IF NOT EXISTS acta_comite_path TEXT,
  ADD COLUMN IF NOT EXISTS resolucion_path TEXT,
  ADD COLUMN IF NOT EXISTS solicitud_coordinadores_path TEXT,
  ADD COLUMN IF NOT EXISTS disminucion_gasto_path TEXT,
  ADD COLUMN IF NOT EXISTS otros_documentos JSONB DEFAULT '[]'::jsonb,
  
  -- Observaciones y comentarios
  ADD COLUMN IF NOT EXISTS observaciones TEXT,
  ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT,
  ADD COLUMN IF NOT EXISTS comentarios JSONB DEFAULT '[]'::jsonb,
  
  -- Fechas de transiciones
  ADD COLUMN IF NOT EXISTS fecha_recibido TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fecha_enviado_comite TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fecha_aprobado TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fecha_rechazado TIMESTAMPTZ;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON public.solicitudes(status);
CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo ON public.solicitudes(tipo_solicitud);
CREATE INDEX IF NOT EXISTS idx_solicitudes_director ON public.solicitudes(director_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_comite ON public.solicitudes(comite_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_coordinador ON public.solicitudes(coordinador_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_nombre_proyecto ON public.solicitudes(nombre_proyecto);

-- =====================================================
-- TABLA: solicitud_historial
-- =====================================================

CREATE TABLE IF NOT EXISTS public.solicitud_historial (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  
  -- Cambio de estado
  estado_anterior TEXT,
  estado_nuevo TEXT NOT NULL,
  
  -- Usuario que realizó el cambio
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_name TEXT, -- Nombre del usuario para histórico
  user_role TEXT, -- Rol del usuario al momento del cambio
  
  -- Detalles del cambio
  comentario TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- Información adicional
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para historial
CREATE INDEX idx_solicitud_historial_solicitud ON public.solicitud_historial(solicitud_id);
CREATE INDEX idx_solicitud_historial_user ON public.solicitud_historial(user_id);
CREATE INDEX idx_solicitud_historial_created ON public.solicitud_historial(created_at DESC);

-- =====================================================
-- TRIGGERS PARA AUDITORÍA AUTOMÁTICA
-- =====================================================

-- Función para registrar cambios de estado automáticamente
CREATE OR REPLACE FUNCTION registrar_cambio_estado_solicitud()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_user_role TEXT;
BEGIN
  -- Solo registrar si el estado cambió
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Obtener nombre del usuario actual
    SELECT COALESCE(raw_user_meta_data->>'name', email)
    INTO v_user_name
    FROM auth.users
    WHERE id = auth.uid();
    
    -- Obtener rol del usuario (primer rol encontrado)
    SELECT r.name
    INTO v_user_role
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    LIMIT 1;
    
    -- Insertar en historial
    INSERT INTO public.solicitud_historial (
      solicitud_id,
      estado_anterior,
      estado_nuevo,
      user_id,
      user_name,
      user_role,
      comentario,
      metadata
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      v_user_name,
      v_user_role,
      CASE 
        WHEN NEW.status = 'rechazado' THEN NEW.motivo_rechazo
        WHEN NEW.status = 'observado' THEN NEW.observaciones
        ELSE NULL
      END,
      jsonb_build_object(
        'fecha_cambio', NOW(),
        'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for'
      )
    );
    
    -- Actualizar fechas según el nuevo estado
    IF NEW.status = 'recibido' THEN
      NEW.fecha_recibido = NOW();
    ELSIF NEW.status = 'en_comite' THEN
      NEW.fecha_enviado_comite = NOW();
    ELSIF NEW.status = 'aprobado' THEN
      NEW.fecha_aprobado = NOW();
    ELSIF NEW.status = 'rechazado' THEN
      NEW.fecha_rechazado = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_registrar_cambio_estado ON public.solicitudes;
CREATE TRIGGER trigger_registrar_cambio_estado
  BEFORE UPDATE ON public.solicitudes
  FOR EACH ROW
  EXECUTE FUNCTION registrar_cambio_estado_solicitud();

-- =====================================================
-- FUNCIÓN: Validar Transiciones de Estado
-- =====================================================

CREATE OR REPLACE FUNCTION validar_transicion_estado(
  p_estado_actual TEXT,
  p_estado_nuevo TEXT,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_roles TEXT[];
  v_es_valido BOOLEAN := FALSE;
BEGIN
  -- Obtener roles del usuario
  SELECT ARRAY_AGG(r.name)
  INTO v_user_roles
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id;
  
  -- Validar transiciones según estado actual y roles
  CASE p_estado_actual
    -- Desde NUEVO
    WHEN 'nuevo' THEN
      IF p_estado_nuevo = 'recibido' AND 'director' = ANY(v_user_roles) THEN
        v_es_valido := TRUE;
      ELSIF p_estado_nuevo = 'rechazado' AND 'director' = ANY(v_user_roles) THEN
        v_es_valido := TRUE;
      END IF;
    
    -- Desde RECIBIDO
    WHEN 'recibido' THEN
      IF p_estado_nuevo = 'en_comite' AND 'director' = ANY(v_user_roles) THEN
        v_es_valido := TRUE;
      ELSIF p_estado_nuevo = 'rechazado' AND 'director' = ANY(v_user_roles) THEN
        v_es_valido := TRUE;
      END IF;
    
    -- Desde EN_COMITE
    WHEN 'en_comite' THEN
      IF p_estado_nuevo IN ('aprobado', 'rechazado', 'observado') 
         AND ('comite' = ANY(v_user_roles) OR 'administrador' = ANY(v_user_roles)) THEN
        v_es_valido := TRUE;
      END IF;
    
    -- Desde OBSERVADO
    WHEN 'observado' THEN
      IF p_estado_nuevo = 'nuevo' AND 'director' = ANY(v_user_roles) THEN
        v_es_valido := TRUE;
      ELSIF p_estado_nuevo = 'rechazado' AND 'director' = ANY(v_user_roles) THEN
        v_es_valido := TRUE;
      END IF;
    
    ELSE
      v_es_valido := FALSE;
  END CASE;
  
  -- Administradores pueden hacer cualquier transición
  IF 'administrador' = ANY(v_user_roles) OR 'admin' = ANY(v_user_roles) THEN
    v_es_valido := TRUE;
  END IF;
  
  RETURN v_es_valido;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: Validar Documentos Requeridos
-- =====================================================

CREATE OR REPLACE FUNCTION validar_documentos_requeridos(
  p_tipo_solicitud TEXT,
  p_solicitud_id UUID
) RETURNS TABLE (
  documento TEXT,
  requerido BOOLEAN,
  presente BOOLEAN,
  mensaje TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH solicitud_docs AS (
    SELECT 
      ficha_tecnica_path,
      formato_003_path,
      contrato_path,
      convenio_path,
      acta_comite_path,
      resolucion_path
    FROM public.solicitudes
    WHERE id = p_solicitud_id
  )
  SELECT 
    doc.nombre::TEXT,
    doc.requerido,
    CASE doc.nombre
      WHEN 'ficha_tecnica' THEN (SELECT ficha_tecnica_path IS NOT NULL FROM solicitud_docs)
      WHEN 'formato_003' THEN (SELECT formato_003_path IS NOT NULL FROM solicitud_docs)
      WHEN 'contrato' THEN (SELECT contrato_path IS NOT NULL FROM solicitud_docs)
      WHEN 'convenio' THEN (SELECT convenio_path IS NOT NULL FROM solicitud_docs)
      WHEN 'acta_comite' THEN (SELECT acta_comite_path IS NOT NULL FROM solicitud_docs)
      WHEN 'resolucion' THEN (SELECT resolucion_path IS NOT NULL FROM solicitud_docs)
    END AS presente,
    CASE 
      WHEN doc.requerido AND NOT CASE doc.nombre
        WHEN 'ficha_tecnica' THEN (SELECT ficha_tecnica_path IS NOT NULL FROM solicitud_docs)
        WHEN 'formato_003' THEN (SELECT formato_003_path IS NOT NULL FROM solicitud_docs)
        WHEN 'contrato' THEN (SELECT contrato_path IS NOT NULL FROM solicitud_docs)
        WHEN 'convenio' THEN (SELECT convenio_path IS NOT NULL FROM solicitud_docs)
        WHEN 'acta_comite' THEN (SELECT acta_comite_path IS NOT NULL FROM solicitud_docs)
        WHEN 'resolucion' THEN (SELECT resolucion_path IS NOT NULL FROM solicitud_docs)
      END
      THEN 'Documento requerido faltante'
      ELSE 'OK'
    END AS mensaje
  FROM (
    -- Documentos según tipo de solicitud
    SELECT 'ficha_tecnica' AS nombre, 
           p_tipo_solicitud IN ('diplomado_extension', 'contrato', 'convenio') AS requerido
    UNION ALL
    SELECT 'formato_003', TRUE
    UNION ALL
    SELECT 'contrato', p_tipo_solicitud = 'contrato'
    UNION ALL
    SELECT 'convenio', p_tipo_solicitud = 'convenio'
    UNION ALL
    SELECT 'acta_comite', FALSE -- Se adjunta al aprobar
    UNION ALL
    SELECT 'resolucion', FALSE -- Se genera automáticamente
  ) doc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en solicitud_historial
ALTER TABLE public.solicitud_historial ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver el historial de solicitudes que pueden ver
CREATE POLICY "Users can view history of accessible solicitudes"
  ON public.solicitud_historial
  FOR SELECT
  USING (
    solicitud_id IN (
      SELECT id FROM public.solicitudes
      WHERE created_by = auth.uid()
      OR center_id IN (
        SELECT center_id FROM public.user_centers WHERE user_id = auth.uid()
      )
    )
  );

-- Política: Solo el sistema puede insertar en historial (via trigger)
CREATE POLICY "Only system can insert history"
  ON public.solicitud_historial
  FOR INSERT
  WITH CHECK (FALSE); -- Bloqueado para inserts directos, solo via trigger

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.solicitud_historial IS 'Historial de cambios de estado de solicitudes';
COMMENT ON COLUMN public.solicitudes.nombre_proyecto IS 'Nombre del proyecto extraído de la ficha técnica (fila #10)';
COMMENT ON COLUMN public.solicitudes.tipo_solicitud IS 'Tipo: diplomado_proyeccion_social, diplomado_extension, contrato, convenio';
COMMENT ON COLUMN public.solicitudes.comite_id IS 'Referencia al grupo de usuarios que actúa como comité';
COMMENT ON FUNCTION validar_transicion_estado IS 'Valida si una transición de estado es permitida según el rol del usuario';
COMMENT ON FUNCTION validar_documentos_requeridos IS 'Verifica qué documentos son requeridos y cuáles están presentes';