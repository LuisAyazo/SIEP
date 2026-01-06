-- Configuración de Supabase Storage para Solicitudes
-- Fecha: 2025-12-17

-- =====================================================
-- 1. CREAR BUCKETS
-- =====================================================

-- Bucket para documentos de solicitudes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'solicitudes',
  'solicitudes',
  false, -- No público, requiere autenticación
  52428800, -- 50MB límite por archivo
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', -- .xlsx
    'application/vnd.ms-excel', -- .xls
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- .docx
    'application/msword', -- .doc
    'image/jpeg',
    'image/png',
    'image/jpg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. POLÍTICAS RLS PARA STORAGE
-- =====================================================

-- Permitir a usuarios autenticados subir archivos a sus propias carpetas
CREATE POLICY "Users can upload to their own folders"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'solicitudes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir a usuarios ver sus propios archivos
CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'solicitudes' AND
  (
    -- El usuario es el dueño de la carpeta
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- O el usuario tiene acceso a través de una solicitud
    EXISTS (
      SELECT 1 FROM public.solicitudes s
      WHERE s.id::text = (storage.foldername(name))[2]
      AND (
        s.created_by = auth.uid()
        OR s.director_id = auth.uid()
        OR s.coordinador_id = auth.uid()
        OR s.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.user_group_members ugm
          JOIN public.solicitudes sol ON sol.comite_id = ugm.group_id
          WHERE ugm.user_id = auth.uid()
          AND sol.id = s.id
        )
      )
    )
  )
);

-- Permitir a usuarios actualizar sus propios archivos
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'solicitudes' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'solicitudes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir a usuarios eliminar sus propios archivos
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'solicitudes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- 3. FUNCIONES AUXILIARES
-- =====================================================

-- Función para generar path de archivo en storage
CREATE OR REPLACE FUNCTION public.generate_storage_path(
  p_user_id UUID,
  p_solicitud_id UUID,
  p_tipo_documento TEXT,
  p_filename TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Formato: {user_id}/{solicitud_id}/{tipo_documento}/{filename}
  RETURN format(
    '%s/%s/%s/%s',
    p_user_id::text,
    p_solicitud_id::text,
    p_tipo_documento,
    p_filename
  );
END;
$$;

-- Función para extraer nombre de proyecto del Excel (fila #10)
CREATE OR REPLACE FUNCTION public.extract_project_name_from_excel(
  p_excel_data JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_project_name TEXT;
BEGIN
  -- Intentar extraer de la fila 10 (índice 9 en array 0-based)
  -- Asumiendo que el nombre está en la columna B (índice 1)
  v_project_name := p_excel_data->'fichatecnica'->>'Nombre del Proyecto';
  
  -- Si no se encuentra, intentar con otras variaciones
  IF v_project_name IS NULL OR v_project_name = '' THEN
    v_project_name := p_excel_data->'fichatecnica'->>'nombre_del_proyecto';
  END IF;
  
  -- Si aún no se encuentra, usar un nombre por defecto
  IF v_project_name IS NULL OR v_project_name = '' THEN
    v_project_name := 'Proyecto_' || to_char(NOW(), 'YYYYMMDD_HH24MISS');
  END IF;
  
  -- Limpiar el nombre (remover caracteres especiales)
  v_project_name := regexp_replace(v_project_name, '[^a-zA-Z0-9_\-\s]', '', 'g');
  v_project_name := regexp_replace(v_project_name, '\s+', '_', 'g');
  
  RETURN v_project_name;
END;
$$;

-- =====================================================
-- 4. COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION public.generate_storage_path IS 
'Genera la ruta completa para almacenar un archivo en Supabase Storage';

COMMENT ON FUNCTION public.extract_project_name_from_excel IS 
'Extrae el nombre del proyecto de los datos del Excel (fila #10)';