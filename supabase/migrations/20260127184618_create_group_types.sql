-- Crear tabla para tipos de grupo personalizados
CREATE TABLE IF NOT EXISTS group_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(nombre)
);

-- Habilitar RLS
ALTER TABLE group_types ENABLE ROW LEVEL SECURITY;

-- Políticas: Todos pueden leer tipos activos
CREATE POLICY "Todos pueden ver tipos de grupo activos"
  ON group_types
  FOR SELECT
  USING (activo = true);

-- Solo administradores pueden crear/editar/eliminar tipos
CREATE POLICY "Solo administradores pueden gestionar tipos de grupo"
  ON group_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'administrador'
    )
  );

-- Insertar tipos por defecto
INSERT INTO group_types (nombre, descripcion) VALUES
  ('Comité', 'Grupo para evaluación de solicitudes y toma de decisiones'),
  ('Equipo', 'Grupo de trabajo colaborativo'),
  ('Lista de Notificación', 'Lista para envío de notificaciones masivas'),
  ('Personalizado', 'Grupo con propósito personalizado')
ON CONFLICT (nombre) DO NOTHING;
