-- =====================================================
-- AGREGAR ESTADOS 'cancelado' Y 'rechazado' A SOLICITUDES
-- =====================================================
-- Fecha: 2026-01-28
-- Descripción: Permite que las solicitudes puedan ser canceladas por el creador
--              y rechazadas por el centro receptor

-- Eliminar el constraint existente
ALTER TABLE public.solicitudes 
  DROP CONSTRAINT IF EXISTS solicitudes_estado_check;

-- Crear el nuevo constraint con los estados adicionales
ALTER TABLE public.solicitudes 
  ADD CONSTRAINT solicitudes_estado_check CHECK (status IN (
    'nuevo',
    'recibido',
    'en_comite',
    'observado',
    'aprobado',
    'rechazado',
    'cancelado'
  ));

-- Comentario
COMMENT ON CONSTRAINT solicitudes_estado_check ON public.solicitudes IS 
  'Estados válidos: nuevo (inicial), recibido (centro lo recibió), en_comite (en revisión), observado (requiere cambios), aprobado (aceptado), rechazado (denegado por centro), cancelado (cancelado por creador)';
