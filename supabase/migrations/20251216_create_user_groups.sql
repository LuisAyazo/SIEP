-- =====================================================
-- MIGRACIÓN: Sistema de Grupos de Usuarios
-- Fecha: 2025-12-16
-- Descripción: Crea tablas para gestionar grupos de usuarios
--              (comités, equipos, grupos de notificación, etc.)
-- =====================================================

-- Tabla: user_groups
-- Almacena los grupos de usuarios del sistema
CREATE TABLE IF NOT EXISTS public.user_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL DEFAULT 'personalizado' CHECK (tipo IN (
    'comite',           -- Comité de evaluación
    'equipo',           -- Equipo de trabajo
    'notificacion',     -- Grupo de notificación
    'personalizado'     -- Definido por usuario
  )),
  centro_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
  activo BOOLEAN DEFAULT TRUE,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT user_groups_nombre_centro_unique UNIQUE(nombre, centro_id)
);

-- Tabla: user_group_members
-- Almacena los miembros de cada grupo
CREATE TABLE IF NOT EXISTS public.user_group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rol dentro del grupo
  rol_en_grupo TEXT DEFAULT 'miembro' CHECK (rol_en_grupo IN (
    'presidente',   -- Líder del grupo
    'secretario',   -- Secretario
    'miembro'       -- Miembro regular
  )),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT user_group_members_unique UNIQUE(group_id, user_id)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_user_groups_centro ON public.user_groups(centro_id);
CREATE INDEX idx_user_groups_tipo ON public.user_groups(tipo);
CREATE INDEX idx_user_groups_activo ON public.user_groups(activo);
CREATE INDEX idx_user_group_members_group ON public.user_group_members(group_id);
CREATE INDEX idx_user_group_members_user ON public.user_group_members(user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_user_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_groups_updated_at
  BEFORE UPDATE ON public.user_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_user_groups_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_group_members ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver grupos de su centro
CREATE POLICY "Users can view groups from their center"
  ON public.user_groups
  FOR SELECT
  USING (
    centro_id IN (
      SELECT center_id 
      FROM public.user_centers 
      WHERE user_id = auth.uid()
    )
  );

-- Política: Solo administradores pueden crear grupos
CREATE POLICY "Only admins can create groups"
  ON public.user_groups
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin')
    )
  );

-- Política: Solo administradores pueden actualizar grupos
CREATE POLICY "Only admins can update groups"
  ON public.user_groups
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin')
    )
  );

-- Política: Solo administradores pueden eliminar grupos
CREATE POLICY "Only admins can delete groups"
  ON public.user_groups
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin')
    )
  );

-- Política: Los usuarios pueden ver miembros de grupos de su centro
CREATE POLICY "Users can view group members from their center"
  ON public.user_group_members
  FOR SELECT
  USING (
    group_id IN (
      SELECT id FROM public.user_groups
      WHERE centro_id IN (
        SELECT center_id 
        FROM public.user_centers 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Política: Solo administradores pueden gestionar miembros
CREATE POLICY "Only admins can manage group members"
  ON public.user_group_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin')
    )
  );

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener miembros de un grupo con información del usuario
CREATE OR REPLACE FUNCTION get_group_members(group_uuid UUID)
RETURNS TABLE (
  member_id UUID,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  rol_en_grupo TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ugm.id as member_id,
    ugm.user_id,
    COALESCE(u.raw_user_meta_data->>'name', u.email) as user_name,
    u.email as user_email,
    ugm.rol_en_grupo,
    ugm.created_at
  FROM public.user_group_members ugm
  JOIN auth.users u ON ugm.user_id = u.id
  WHERE ugm.group_id = group_uuid
  ORDER BY 
    CASE ugm.rol_en_grupo
      WHEN 'presidente' THEN 1
      WHEN 'secretario' THEN 2
      WHEN 'miembro' THEN 3
    END,
    ugm.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es miembro de un grupo
CREATE OR REPLACE FUNCTION is_user_in_group(user_uuid UUID, group_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_group_members
    WHERE user_id = user_uuid 
    AND group_id = group_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.user_groups IS 'Grupos de usuarios del sistema (comités, equipos, etc.)';
COMMENT ON TABLE public.user_group_members IS 'Miembros de los grupos de usuarios';
COMMENT ON COLUMN public.user_groups.tipo IS 'Tipo de grupo: comite, equipo, notificacion, personalizado';
COMMENT ON COLUMN public.user_group_members.rol_en_grupo IS 'Rol del usuario dentro del grupo: presidente, secretario, miembro';
COMMENT ON FUNCTION get_group_members IS 'Obtiene los miembros de un grupo con información del usuario';
COMMENT ON FUNCTION is_user_in_group IS 'Verifica si un usuario pertenece a un grupo';