-- Agregar campo assigned_to_center_id para rastrear a qué centro está asignada la solicitud
ALTER TABLE public.solicitudes
  ADD COLUMN IF NOT EXISTS assigned_to_center_id UUID REFERENCES public.centers(id);

-- Crear índice para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_solicitudes_assigned_to_center ON public.solicitudes(assigned_to_center_id);

-- Comentario
COMMENT ON COLUMN public.solicitudes.assigned_to_center_id IS 'Centro al que está asignada la solicitud (puede ser diferente del centro que la creó)';
