-- =====================================================
-- MIGRACIÓN: Corregir políticas RLS para user_roles
-- Fecha: 2025-12-20
-- Descripción: Agrega políticas RLS para permitir que administradores
--              gestionen roles de usuarios
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete user roles" ON public.user_roles;

-- Habilitar RLS en user_roles si no está habilitado
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propios roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin', 'director_centro')
    )
  );

-- Política: Solo administradores pueden insertar roles
CREATE POLICY "Only admins can insert user roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin')
    )
  );

-- Política: Solo administradores pueden actualizar roles
CREATE POLICY "Only admins can update user roles"
  ON public.user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin')
    )
  );

-- Política: Solo administradores pueden eliminar roles
CREATE POLICY "Only admins can delete user roles"
  ON public.user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin')
    )
  );

-- Comentarios
COMMENT ON POLICY "Users can view their own roles" ON public.user_roles IS 
  'Permite a los usuarios ver sus propios roles y a los administradores ver todos los roles';
COMMENT ON POLICY "Only admins can insert user roles" ON public.user_roles IS 
  'Solo administradores pueden asignar roles a usuarios';
COMMENT ON POLICY "Only admins can update user roles" ON public.user_roles IS 
  'Solo administradores pueden modificar roles de usuarios';
COMMENT ON POLICY "Only admins can delete user roles" ON public.user_roles IS 
  'Solo administradores pueden eliminar roles de usuarios';

-- =====================================================
-- POLÍTICAS RLS PARA user_centers
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view their own centers" ON public.user_centers;
DROP POLICY IF EXISTS "Admins can manage user centers" ON public.user_centers;
DROP POLICY IF EXISTS "Only admins can insert user centers" ON public.user_centers;
DROP POLICY IF EXISTS "Only admins can update user centers" ON public.user_centers;
DROP POLICY IF EXISTS "Only admins can delete user centers" ON public.user_centers;

-- Habilitar RLS en user_centers si no está habilitado
ALTER TABLE public.user_centers ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propios centros asignados
CREATE POLICY "Users can view their own centers"
  ON public.user_centers
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin', 'director_centro')
    )
  );

-- Política: Solo administradores pueden insertar asignaciones de centros
CREATE POLICY "Only admins can insert user centers"
  ON public.user_centers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin')
    )
  );

-- Política: Solo administradores pueden actualizar asignaciones de centros
CREATE POLICY "Only admins can update user centers"
  ON public.user_centers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin')
    )
  );

-- Política: Solo administradores pueden eliminar asignaciones de centros
CREATE POLICY "Only admins can delete user centers"
  ON public.user_centers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin')
    )
  );

-- Comentarios
COMMENT ON POLICY "Users can view their own centers" ON public.user_centers IS
  'Permite a los usuarios ver sus propios centros asignados y a los administradores ver todos';
COMMENT ON POLICY "Only admins can insert user centers" ON public.user_centers IS
  'Solo administradores pueden asignar centros a usuarios';
COMMENT ON POLICY "Only admins can update user centers" ON public.user_centers IS
  'Solo administradores pueden modificar asignaciones de centros';
COMMENT ON POLICY "Only admins can delete user centers" ON public.user_centers IS
  'Solo administradores pueden eliminar asignaciones de centros';
