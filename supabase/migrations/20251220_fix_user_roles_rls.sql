-- =====================================================
-- MIGRACIÓN: Corregir políticas RLS para user_roles y user_centers
-- Fecha: 2025-01-20
-- Problema: Dependencia circular en políticas que causaba "infinite recursion"
-- Solución: Permitir lectura pública de user_roles y user_centers
--           (solo contienen asignaciones, no datos sensibles)
-- =====================================================

-- ============================================================================
-- TABLA: user_roles
-- ============================================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

-- Habilitar RLS en user_roles si no está habilitado
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política de lectura: TODOS pueden ver TODOS los roles
-- Esto es seguro porque user_roles solo contiene asignaciones (user_id, role_id, center_id)
-- No contiene datos sensibles como contraseñas o información personal
CREATE POLICY "Anyone can view all user roles"
  ON public.user_roles
  FOR SELECT
  USING (true);

-- Políticas de escritura: Solo administradores pueden insertar/actualizar/eliminar
CREATE POLICY "Admins can insert user roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin')
      LIMIT 1
    )
  );

CREATE POLICY "Admins can update user roles"
  ON public.user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin')
      LIMIT 1
    )
  );

CREATE POLICY "Admins can delete user roles"
  ON public.user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin')
      LIMIT 1
    )
  );

-- Comentarios
COMMENT ON POLICY "Anyone can view all user roles" ON public.user_roles IS 
  'Permite a todos ver las asignaciones de roles (sin dependencia circular)';
COMMENT ON POLICY "Admins can insert user roles" ON public.user_roles IS 
  'Solo administradores pueden asignar roles a usuarios';
COMMENT ON POLICY "Admins can update user roles" ON public.user_roles IS 
  'Solo administradores pueden modificar roles de usuarios';
COMMENT ON POLICY "Admins can delete user roles" ON public.user_roles IS 
  'Solo administradores pueden eliminar roles de usuarios';

-- ============================================================================
-- TABLA: user_centers
-- ============================================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own centers" ON public.user_centers;
DROP POLICY IF EXISTS "Admins can view all centers" ON public.user_centers;
DROP POLICY IF EXISTS "Admins can manage user centers" ON public.user_centers;
DROP POLICY IF EXISTS "Only admins can insert user centers" ON public.user_centers;
DROP POLICY IF EXISTS "Only admins can update user centers" ON public.user_centers;
DROP POLICY IF EXISTS "Only admins can delete user centers" ON public.user_centers;
DROP POLICY IF EXISTS "Anyone can view all user centers" ON public.user_centers;
DROP POLICY IF EXISTS "Admins can insert user centers" ON public.user_centers;
DROP POLICY IF EXISTS "Admins can update user centers" ON public.user_centers;
DROP POLICY IF EXISTS "Admins can delete user centers" ON public.user_centers;

-- Habilitar RLS en user_centers si no está habilitado
ALTER TABLE public.user_centers ENABLE ROW LEVEL SECURITY;

-- Política de lectura: TODOS pueden ver TODOS los centros asignados
-- Esto es seguro porque user_centers solo contiene asignaciones (user_id, center_id)
CREATE POLICY "Anyone can view all user centers"
  ON public.user_centers
  FOR SELECT
  USING (true);

-- Políticas de escritura: Solo administradores pueden insertar/actualizar/eliminar
CREATE POLICY "Admins can insert user centers"
  ON public.user_centers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin')
      LIMIT 1
    )
  );

CREATE POLICY "Admins can update user centers"
  ON public.user_centers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin')
      LIMIT 1
    )
  );

CREATE POLICY "Admins can delete user centers"
  ON public.user_centers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('administrador', 'admin', 'superadmin')
      LIMIT 1
    )
  );

-- Comentarios
COMMENT ON POLICY "Anyone can view all user centers" ON public.user_centers IS
  'Permite a todos ver las asignaciones de centros (sin dependencia circular)';
COMMENT ON POLICY "Admins can insert user centers" ON public.user_centers IS
  'Solo administradores pueden asignar centros a usuarios';
COMMENT ON POLICY "Admins can update user centers" ON public.user_centers IS
  'Solo administradores pueden modificar asignaciones de centros';
COMMENT ON POLICY "Admins can delete user centers" ON public.user_centers IS
  'Solo administradores pueden eliminar asignaciones de centros';
