'use client';

import { useSupabaseSession } from '@/components/providers/SessionProvider';
import { hasPermission, PermissionLevel, Permission, UserRole } from './permissions';

/**
 * Hook to check if the current user has the specified permission
 * @param resource The resource to check permission for
 * @param level The permission level required
 * @returns Boolean indicating if the user has the permission
 */
export function usePermission(resource: string, level: PermissionLevel): boolean {
  const { user } = useSupabaseSession();
  
  if (!user) {
    return false;
  }

  const userRole = (user as any).role as string || 'funcionario';
  
  // Map string role to UserRole enum if possible
  let role: string = userRole;
  
  // Mapear roles legacy
  const roleMap: Record<string, string> = {
    'usuario': 'funcionario',
    'superadmin': 'administrador',
    'admin': 'director_centro',
    'manager': 'director_centro',
    'editor': 'funcionario',
    'viewer': 'funcionario'
  };
  
  role = roleMap[userRole] || userRole;

  // Use the user-role based permission check
  return hasPermission(
    { role: role as any },
    resource,
    level
  );
}

/**
 * Hook to get all permissions for the current user based on their role
 * @returns Array of derived permissions for the current user
 */
export function usePermissions(): Permission[] {
  const { user } = useSupabaseSession();
  
  if (!user) {
    return [];
  }
  
  const userRoleStr = (user as any).role as string || 'funcionario';
  
  // Mapear roles legacy
  const roleMap: Record<string, string> = {
    'usuario': 'funcionario',
    'superadmin': 'administrador',
    'admin': 'director_centro',
    'manager': 'director_centro',
    'editor': 'funcionario',
    'viewer': 'funcionario'
  };
  
  const role = roleMap[userRoleStr] || userRoleStr;
  
  // Import RESOURCES and getRolePermissions from permissions
  const { getRolePermissions } = require('./permissions');
  
  return getRolePermissions(role);
}

/**
 * Hook to check if the current user is a super admin
 * @returns Boolean indicating if the user has super admin role
 */
export function useIsSuperAdmin(): boolean {
  const { user } = useSupabaseSession();
  
  if (!user) {
    return false;
  }
  
  const userRole = (user as any).role as string || '';
  return userRole === 'administrador' || userRole === 'superadmin';
}
