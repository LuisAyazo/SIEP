-- Agregar relación entre meetings y solicitudes
ALTER TABLE meetings
ADD COLUMN solicitud_id UUID REFERENCES solicitudes(id) ON DELETE SET NULL;

-- Crear índice para mejorar performance
CREATE INDEX idx_meetings_solicitud_id ON meetings(solicitud_id);

-- Comentario
COMMENT ON COLUMN meetings.solicitud_id IS 'Solicitud relacionada con este comité (opcional)';
