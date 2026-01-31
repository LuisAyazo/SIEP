-- Agregar soporte para participantes externos en meetings
-- Permitir que user_id sea NULL y agregar external_email

-- 1. Hacer user_id nullable
ALTER TABLE meeting_participants 
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Agregar columna para email externo
ALTER TABLE meeting_participants 
  ADD COLUMN external_email TEXT;

-- 3. Agregar constraint: debe tener user_id O external_email
ALTER TABLE meeting_participants
  ADD CONSTRAINT meeting_participants_user_or_external_check 
  CHECK (
    (user_id IS NOT NULL AND external_email IS NULL) OR
    (user_id IS NULL AND external_email IS NOT NULL)
  );

-- 4. Agregar índice para búsquedas por email externo
CREATE INDEX idx_meeting_participants_external_email 
  ON meeting_participants(external_email) 
  WHERE external_email IS NOT NULL;

-- 5. Comentarios para documentación
COMMENT ON COLUMN meeting_participants.external_email IS 'Email de participante externo (no registrado en el sistema)';
COMMENT ON CONSTRAINT meeting_participants_user_or_external_check ON meeting_participants IS 'Un participante debe ser interno (user_id) o externo (external_email), pero no ambos';
