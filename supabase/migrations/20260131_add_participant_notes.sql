-- Agregar columna notes a meeting_participants
ALTER TABLE meeting_participants 
  ADD COLUMN notes TEXT;

-- Comentario para documentación
COMMENT ON COLUMN meeting_participants.notes IS 'Notas adicionales sobre el participante en esta reunión específica';
