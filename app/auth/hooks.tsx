'use client';

import { useCallback, useMemo } from 'react';
import { useSupabaseSession } from '@/components/providers/SessionProvider';
import { PermissionLevel, UserRole, getSessionWithRole, hasPermission } from './permissions';

/**
 * Hook to check if the current user has permission for a resource
 * @param resource The resource to check permission for
 * @param level The required permission level
 * @returns An object with the permission status and session data
 */
export function usePermission(resource: string, level: PermissionLevel) {
  const { user, session, loading } = useSupabaseSession();
  
  const sessionWithRole = useMemo(() => {
    if (!user) return null;
    
    // Obtener datos del perfil desde user metadata o construir manualmente
    const profileData = {
      role: (user as any).role || 'funcionario',
      center_id: (user as any).centerId || null
    };
    
    return getSessionWithRole(user as any, profileData);
  }, [user]);
  
  const checkPermission = useCallback(() => {
    if (!sessionWithRole || !sessionWithRole.user) {
      return false;
    }
    return hasPermission(sessionWithRole.user as any, resource, level);
  }, [sessionWithRole, resource, level]);

  return {
    hasPermission: checkPermission(),
    isLoading: loading,
    session: sessionWithRole,
    isAuthenticated: !!sessionWithRole,
    userRole: sessionWithRole?.user?.role as UserRole | undefined,
    centerId: sessionWithRole?.user?.centerId
  };
}

/**
 * Hook to get the current user's role
 * @returns The current user's role or undefined
 */
export function useUserRole() {
  const { user } = useSupabaseSession();
  
  const role = useMemo(() => {
    if (!user) return undefined;
    
    const userRole = (user as any).role as string || 'funcionario';
    
    // Mapear roles legacy
    const roleMap: Record<string, string> = {
      'usuario': 'funcionario',
      'superadmin': 'administrador',
      'admin': 'director_centro',
      'manager': 'director_centro',
      'editor': 'funcionario',
      'viewer': 'funcionario'
    };
    
    return roleMap[userRole] || userRole;
  }, [user]);
  
  return role as UserRole | undefined;
}

/**
 * Hook to get the current user's center ID
 * @returns The current user's center ID or undefined
 */
export function useUserCenter() {
  const { user } = useSupabaseSession();
  
  const centerId = useMemo(() => {
    if (!user) return undefined;
    return (user as any).centerId || null;
  }, [user]);
  
  return centerId;
}

/**
 * Hook to check if the current user is a superadmin
 * @returns Boolean indicating if the user is a superadmin
 */
export function useIsSuperAdmin() {
  const { user } = useSupabaseSession();
  
  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    const userRole = (user as any).role as string || '';
    return userRole === 'administrador' || userRole === 'superadmin';
  }, [user]);
  
  return isSuperAdmin;
}