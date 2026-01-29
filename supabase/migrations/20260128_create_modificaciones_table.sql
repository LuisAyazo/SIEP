-- Crear tabla de modificaciones para tracking de cambios
CREATE TABLE IF NOT EXISTS public.modificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  centro_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'solicitud', 'ficha', 'documento', etc.
  accion TEXT NOT NULL, -- 'crear', 'editar', 'eliminar', 'cancelar', 'aprobar', etc.
  descripcion TEXT NOT NULL,
  usuario_id UUID NOT NULL,
  usuario_nombre TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_modificaciones_centro ON public.modificaciones(centro_id);
CREATE INDEX IF NOT EXISTS idx_modificaciones_tipo ON public.modificaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_modificaciones_created_at ON public.modificaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_modificaciones_usuario ON public.modificaciones(usuario_id);

-- RLS Policies
ALTER TABLE public.modificaciones ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuarios autenticados pueden ver modificaciones de sus centros
CREATE POLICY "Users can view modifications of their centers"
  ON public.modificaciones
  FOR SELECT
  TO authenticated
  USING (
    centro_id IN (
      SELECT center_id 
      FROM public.user_centers 
      WHERE user_id = auth.uid()
    )
  );

-- Política para INSERT: usuarios autenticados pueden insertar modificaciones
CREATE POLICY "Authenticated users can insert modifications"
  ON public.modificaciones
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para service_role: acceso completo
CREATE POLICY "Service role has full access to modifications"
  ON public.modificaciones
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Arreglar RLS en solicitud_historial para permitir inserts
DROP POLICY IF EXISTS "Users can insert historial" ON public.solicitud_historial;

CREATE POLICY "Authenticated users can insert historial"
  ON public.solicitud_historial
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
