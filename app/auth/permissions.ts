// Define user roles - Actualizados para coincidir con los 6 roles de Supabase
export enum UserRole {
  ADMINISTRADOR = 'administrador',          // Acceso total
  DIRECTOR_CENTRO = 'director_centro',      // Gestión de centro
  FUNCIONARIO = 'funcionario',              // Usuario estándar con permisos de creación
  OPERACION = 'operacion',                  // Rol de operación con permisos limitados
  CONSULTA = 'consulta',                    // Rol de solo lectura
  COORDINADOR_CENTRO = 'coordinador_centro', // Coordinación de actividades del centro
  
  // Mantener roles legacy como alias para compatibilidad
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

// Define permission levels
export enum PermissionLevel {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin'
}

// Define actions (alias de PermissionLevel para mantener compatibilidad con código existente)
export const ACTIONS = PermissionLevel;

// Define resources - Sistema completo de recursos
export const RESOURCES = {
  DASHBOARD: 'dashboard',
  CENTERS: 'centers',
  USERS: 'users',
  ROLES: 'roles',
  SOLICITUDES: 'solicitudes',
  MEETINGS: 'meetings',
  DOCUMENTS: 'documents',
  SETTINGS: 'settings',
  FICHAS: 'fichas',
  HISTORY: 'history',
  FINANCES: 'finances',
  REPORTS: 'reports',
  BUDGET: 'budget',
  PROJECTS: 'projects'
};

export type Permission = {
  resource: string;
  level: PermissionLevel;
};

// Permission matrix defining what roles have access to which resources
const PERMISSIONS: Record<string, Record<string, PermissionLevel[]>> = {
  // 1. Rol Administrador - Acceso total (22 permisos)
  [UserRole.ADMINISTRADOR]: {
    '*': [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.DELETE, PermissionLevel.ADMIN]
  },
  
  // 2. Rol Director de Centro - Gestión de centro (12 permisos)
  // El director puede crear roles, gestionar usuarios, y revisar/aprobar solicitudes
  [UserRole.DIRECTOR_CENTRO]: {
    [RESOURCES.DASHBOARD]: [PermissionLevel.READ],
    [RESOURCES.USERS]: [PermissionLevel.READ, PermissionLevel.WRITE], // Gestionar usuarios del centro
    [RESOURCES.ROLES]: [PermissionLevel.READ, PermissionLevel.WRITE], // Crear y asignar roles
    [RESOURCES.SOLICITUDES]: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.ADMIN], // Ver y aprobar/rechazar solicitudes del centro
    [RESOURCES.MEETINGS]: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.ADMIN],
    [RESOURCES.CENTERS]: [PermissionLevel.ADMIN], // centers.manage
    [RESOURCES.REPORTS]: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.ADMIN],
    [RESOURCES.BUDGET]: [PermissionLevel.READ],
    [RESOURCES.DOCUMENTS]: [PermissionLevel.READ],
    [RESOURCES.FICHAS]: [PermissionLevel.READ],
    [RESOURCES.HISTORY]: [PermissionLevel.READ],
    [RESOURCES.SETTINGS]: [PermissionLevel.READ],
  },
  
  // 3. Rol Funcionario - Usuario estándar con permisos limitados
  // El funcionario SOLO puede ver Operación > Mis Solicitudes (sus propias solicitudes)
  [UserRole.FUNCIONARIO]: {
    [RESOURCES.SOLICITUDES]: [PermissionLevel.READ, PermissionLevel.WRITE], // Solo puede crear y ver sus propias solicitudes
  },
  
  // 4. Rol Operación - Operación con permisos limitados (5 permisos)
  [UserRole.OPERACION]: {
    [RESOURCES.SOLICITUDES]: [PermissionLevel.READ], // read, comment
    [RESOURCES.MEETINGS]: [PermissionLevel.READ],
    [RESOURCES.REPORTS]: [PermissionLevel.READ], // basic, view
    [RESOURCES.DOCUMENTS]: [PermissionLevel.READ],
    [RESOURCES.FICHAS]: [PermissionLevel.READ],
  },
  
  // 5. Rol Consulta - Solo lectura (3 permisos)
  [UserRole.CONSULTA]: {
    [RESOURCES.SOLICITUDES]: [PermissionLevel.READ],
    [RESOURCES.MEETINGS]: [PermissionLevel.READ],
    [RESOURCES.REPORTS]: [PermissionLevel.READ], // view only
  },
  
  // 6. Rol Coordinador de Centro - Coordinación (6 permisos)
  [UserRole.COORDINADOR_CENTRO]: {
    [RESOURCES.SOLICITUDES]: [PermissionLevel.READ], // read, comment
    [RESOURCES.MEETINGS]: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.ADMIN], // create, read, update
    [RESOURCES.REPORTS]: [PermissionLevel.READ, PermissionLevel.WRITE], // center, view
    [RESOURCES.DOCUMENTS]: [PermissionLevel.READ],
    [RESOURCES.FICHAS]: [PermissionLevel.READ],
  },
};

// Type for user with role
interface UserWithRole {
  role?: UserRole;
  [key: string]: any;
}

/**
 * Check if a user has permission for a specific resource and permission level
 * This function supports two overloads:
 * 1. Check against array of permissions
 * 2. Check against user role using the PERMISSIONS matrix
 */
export function hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean;
export function hasPermission(user: UserWithRole, resource: string, requiredPermission: PermissionLevel): boolean;
export function hasPermission(...args: any[]): boolean {
  // Handle the first overload: (userPermissions, requiredPermission)
  if (args.length === 2 && Array.isArray(args[0])) {
    const [userPermissions, requiredPermission] = args as [Permission[], Permission];
    
    // Admin users have all permissions
    if (userPermissions.some(p => p.resource === '*' && p.level === PermissionLevel.ADMIN)) {
      return true;
    }
    
    return userPermissions.some(permission => {
      // Exact match for resource and level
      if (permission.resource === requiredPermission.resource &&
          permission.level === requiredPermission.level) {
        return true;
      }
      
      // ADMIN level for this resource grants all permissions for the resource
      if (permission.resource === requiredPermission.resource &&
          permission.level === PermissionLevel.ADMIN) {
        return true;
      }
      
      // Wildcard resource with matching level
      if (permission.resource === '*' &&
          permission.level === requiredPermission.level) {
        return true;
      }
      
      return false;
    });
  }
  // Handle the second overload: (user, resource, requiredPermission)
  else if (args.length === 3 && typeof args[1] === 'string') {
    const [user, resource, requiredPermission] = args as [UserWithRole, string, PermissionLevel];
    
    // Default to funcionario if no role is specified
    let role = (user.role as string) || 'funcionario';
    
    // Mapear roles legacy a nuevos roles (6 roles del sistema)
    const roleMap: Record<string, string> = {
      'superadmin': 'administrador',
      'admin': 'director_centro',
      'manager': 'director_centro',
      'editor': 'funcionario',
      'viewer': 'consulta',  // viewer -> consulta (solo lectura)
      'usuario': 'funcionario'
    };
    
    role = roleMap[role] || role;
    
    // Administrador tiene acceso total a todos los recursos
    if (role === 'administrador') {
      return true;
    }
    
    // Get permissions for this role and resource
    const rolePermissions = PERMISSIONS[role]?.[resource] || [];
    
    return rolePermissions.includes(requiredPermission);
  }
  
  // Invalid arguments
  return false;
}

// Helper function to convert UserRole to Permission[]
export function getRolePermissions(role: UserRole | string): Permission[] {
  if (!role) return [];
  
  const permissions: Permission[] = [];
  
  // Mapear roles legacy a nuevos roles (6 roles del sistema)
  const roleMap: Record<string, string> = {
    'superadmin': 'administrador',
    'admin': 'director_centro',
    'manager': 'director_centro',
    'editor': 'funcionario',
    'viewer': 'consulta',  // viewer -> consulta (solo lectura)
    'usuario': 'funcionario'
  };
  
  const mappedRole = roleMap[role as string] || role;
  
  // Handle administrador special case
  if (mappedRole === 'administrador') {
    return [{ resource: '*', level: PermissionLevel.ADMIN }];
  }
  
  // For all other roles, extract permissions from the PERMISSIONS matrix
  const rolePermissionsMap = PERMISSIONS[mappedRole] || {};
  
  Object.entries(rolePermissionsMap).forEach(([resource, levels]) => {
    levels.forEach(level => {
      permissions.push({
        resource,
        level
      });
    });
  });
  
  return permissions;
}

// Type for session with user role - Compatible con Supabase
export interface SessionWithRole {
  user: {
    id: string;
    role: UserRole | string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    centerId?: string | null;
    [key: string]: any;
  };
  expires?: string;
  [key: string]: any;
}

// Type for Supabase user with profile data
export interface SupabaseUserWithProfile {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  profile?: {
    role?: string;
    center_id?: string;
  };
}

// Function to convert Supabase session to SessionWithRole
export function getSessionWithRole(
  user?: SupabaseUserWithProfile | null,
  profileData?: any
): SessionWithRole | null {
  if (!user?.id) {
    return null;
  }

  // Obtener rol del perfil o metadata
  let role = profileData?.role || user.profile?.role || UserRole.FUNCIONARIO;
  
  // Mapear roles legacy a los 6 roles del sistema
  const roleMap: Record<string, UserRole> = {
    'usuario': UserRole.FUNCIONARIO,
    'superadmin': UserRole.ADMINISTRADOR,
    'admin': UserRole.DIRECTOR_CENTRO,
    'manager': UserRole.DIRECTOR_CENTRO,
    'editor': UserRole.FUNCIONARIO,
    'viewer': UserRole.CONSULTA
  };
  
  role = roleMap[role] || role;

  return {
    user: {
      id: user.id,
      email: user.email || null,
      name: user.user_metadata?.full_name || null,
      image: user.user_metadata?.avatar_url || null,
      role: role as UserRole,
      centerId: profileData?.center_id || user.profile?.center_id || null
    }
  };
}

// React hook for permissions
export function usePermission(resource: string, requiredLevel: PermissionLevel) {
  // In a real implementation, this would use React hooks to get the session
  // For now it's just a placeholder function structure
  return {
    hasPermission: false,
    isLoading: true,
    error: null
  };
}