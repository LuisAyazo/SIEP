// Sistema de permisos granulares para SIEP
// Cada permiso tiene formato: recurso.accion

export const GRANULAR_PERMISSIONS = {
  // Solicitudes
  SOLICITUDES_CREATE: 'solicitudes.create',
  SOLICITUDES_READ: 'solicitudes.read',
  SOLICITUDES_UPDATE: 'solicitudes.update',
  SOLICITUDES_DELETE: 'solicitudes.delete',
  SOLICITUDES_COMMENT: 'solicitudes.comment',
  SOLICITUDES_UPLOAD_FILES: 'solicitudes.upload_files',
  SOLICITUDES_APPROVE: 'solicitudes.approve',
  SOLICITUDES_REJECT: 'solicitudes.reject',
  SOLICITUDES_ASSIGN: 'solicitudes.assign',
  
  // Comités (Meetings)
  MEETINGS_CREATE: 'meetings.create',
  MEETINGS_READ: 'meetings.read',
  MEETINGS_UPDATE: 'meetings.update',
  MEETINGS_DELETE: 'meetings.delete',
  MEETINGS_MANAGE_PARTICIPANTS: 'meetings.manage_participants',
  
  // Reportes
  REPORTS_OWN: 'reports.own',
  REPORTS_VIEW: 'reports.view',
  REPORTS_CENTER: 'reports.center',
  REPORTS_ALL: 'reports.all',
  REPORTS_CREATE: 'reports.create',
  REPORTS_EXPORT: 'reports.export',
  
  // Usuarios
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_ASSIGN_ROLES: 'users.assign_roles',
  USERS_MANAGE_CENTER: 'users.manage_center',
  
  // Roles
  ROLES_CREATE: 'roles.create',
  ROLES_READ: 'roles.read',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  ROLES_ASSIGN: 'roles.assign',
  
  // Centros
  CENTERS_CREATE: 'centers.create',
  CENTERS_READ: 'centers.read',
  CENTERS_UPDATE: 'centers.update',
  CENTERS_DELETE: 'centers.delete',
  CENTERS_MANAGE: 'centers.manage',
  
  // Documentos
  DOCUMENTS_CREATE: 'documents.create',
  DOCUMENTS_READ: 'documents.read',
  DOCUMENTS_UPDATE: 'documents.update',
  DOCUMENTS_DELETE: 'documents.delete',
  DOCUMENTS_UPLOAD: 'documents.upload',
  DOCUMENTS_DOWNLOAD: 'documents.download',
  
  // Fichas
  FICHAS_CREATE: 'fichas.create',
  FICHAS_READ: 'fichas.read',
  FICHAS_UPDATE: 'fichas.update',
  FICHAS_DELETE: 'fichas.delete',
  
  // Presupuesto/Finanzas
  BUDGET_READ: 'budget.read',
  BUDGET_CREATE: 'budget.create',
  BUDGET_UPDATE: 'budget.update',
  BUDGET_APPROVE: 'budget.approve',
  
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_VIEW_ALL: 'dashboard.view_all',
  
  // Configuración
  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',
  
  // Historial
  HISTORY_READ: 'history.read',
  HISTORY_VIEW_ALL: 'history.view_all',
  
  // Grupos de Usuarios
  GROUPS_CREATE: 'groups.create',
  GROUPS_READ: 'groups.read',
  GROUPS_UPDATE: 'groups.update',
  GROUPS_DELETE: 'groups.delete',
  GROUPS_MANAGE_MEMBERS: 'groups.manage_members',
} as const;

// Tipo para los permisos
export type GranularPermission = typeof GRANULAR_PERMISSIONS[keyof typeof GRANULAR_PERMISSIONS];

// Definición de permisos por rol
export const ROLE_PERMISSIONS: Record<string, GranularPermission[]> = {
  // Administrador - Todos los permisos
  'administrador': Object.values(GRANULAR_PERMISSIONS),
  
  // Director de Centro
  'director_centro': [
    // Solicitudes - puede hacer todo
    GRANULAR_PERMISSIONS.SOLICITUDES_CREATE,
    GRANULAR_PERMISSIONS.SOLICITUDES_READ,
    GRANULAR_PERMISSIONS.SOLICITUDES_UPDATE,
    GRANULAR_PERMISSIONS.SOLICITUDES_DELETE,
    GRANULAR_PERMISSIONS.SOLICITUDES_COMMENT,
    GRANULAR_PERMISSIONS.SOLICITUDES_UPLOAD_FILES,
    GRANULAR_PERMISSIONS.SOLICITUDES_APPROVE,
    GRANULAR_PERMISSIONS.SOLICITUDES_REJECT,
    GRANULAR_PERMISSIONS.SOLICITUDES_ASSIGN,
    
    // Comités - gestión completa
    GRANULAR_PERMISSIONS.MEETINGS_CREATE,
    GRANULAR_PERMISSIONS.MEETINGS_READ,
    GRANULAR_PERMISSIONS.MEETINGS_UPDATE,
    GRANULAR_PERMISSIONS.MEETINGS_DELETE,
    GRANULAR_PERMISSIONS.MEETINGS_MANAGE_PARTICIPANTS,
    
    // Reportes - del centro y todos
    GRANULAR_PERMISSIONS.REPORTS_CENTER,
    GRANULAR_PERMISSIONS.REPORTS_VIEW,
    GRANULAR_PERMISSIONS.REPORTS_ALL,
    GRANULAR_PERMISSIONS.REPORTS_CREATE,
    GRANULAR_PERMISSIONS.REPORTS_EXPORT,
    
    // Usuarios - gestión del centro
    GRANULAR_PERMISSIONS.USERS_CREATE,
    GRANULAR_PERMISSIONS.USERS_READ,
    GRANULAR_PERMISSIONS.USERS_UPDATE,
    GRANULAR_PERMISSIONS.USERS_ASSIGN_ROLES,
    GRANULAR_PERMISSIONS.USERS_MANAGE_CENTER,
    
    // Roles - crear y asignar
    GRANULAR_PERMISSIONS.ROLES_CREATE,
    GRANULAR_PERMISSIONS.ROLES_READ,
    GRANULAR_PERMISSIONS.ROLES_UPDATE,
    GRANULAR_PERMISSIONS.ROLES_ASSIGN,
    
    // Centros
    GRANULAR_PERMISSIONS.CENTERS_READ,
    GRANULAR_PERMISSIONS.CENTERS_MANAGE,
    
    // Documentos
    GRANULAR_PERMISSIONS.DOCUMENTS_READ,
    GRANULAR_PERMISSIONS.DOCUMENTS_DOWNLOAD,
    
    // Dashboard
    GRANULAR_PERMISSIONS.DASHBOARD_VIEW,
    
    // Configuración
    GRANULAR_PERMISSIONS.SETTINGS_READ,
    
    // Historial
    GRANULAR_PERMISSIONS.HISTORY_READ,
    
    // Grupos
    GRANULAR_PERMISSIONS.GROUPS_CREATE,
    GRANULAR_PERMISSIONS.GROUPS_READ,
    GRANULAR_PERMISSIONS.GROUPS_UPDATE,
    GRANULAR_PERMISSIONS.GROUPS_DELETE,
    GRANULAR_PERMISSIONS.GROUPS_MANAGE_MEMBERS,
  ],
  
  // Funcionario - Permisos limitados
  'funcionario': [
    GRANULAR_PERMISSIONS.SOLICITUDES_CREATE,
    GRANULAR_PERMISSIONS.SOLICITUDES_READ,
    GRANULAR_PERMISSIONS.SOLICITUDES_UPDATE,
    GRANULAR_PERMISSIONS.SOLICITUDES_COMMENT,
    GRANULAR_PERMISSIONS.SOLICITUDES_UPLOAD_FILES,
    GRANULAR_PERMISSIONS.MEETINGS_READ,
    GRANULAR_PERMISSIONS.REPORTS_OWN,
    GRANULAR_PERMISSIONS.FICHAS_CREATE,
    GRANULAR_PERMISSIONS.FICHAS_READ,
    GRANULAR_PERMISSIONS.FICHAS_UPDATE,
    GRANULAR_PERMISSIONS.FICHAS_DELETE,
  ],
  
  // Coordinador de Centro
  'coordinador_centro': [
    GRANULAR_PERMISSIONS.SOLICITUDES_READ,
    GRANULAR_PERMISSIONS.SOLICITUDES_COMMENT,
    GRANULAR_PERMISSIONS.MEETINGS_CREATE,
    GRANULAR_PERMISSIONS.MEETINGS_READ,
    GRANULAR_PERMISSIONS.MEETINGS_UPDATE,
    GRANULAR_PERMISSIONS.MEETINGS_MANAGE_PARTICIPANTS,
    GRANULAR_PERMISSIONS.REPORTS_CENTER,
    GRANULAR_PERMISSIONS.REPORTS_VIEW,
    GRANULAR_PERMISSIONS.DOCUMENTS_READ,
    GRANULAR_PERMISSIONS.FICHAS_READ,
  ],
  
  // Operación
  'operacion': [
    GRANULAR_PERMISSIONS.SOLICITUDES_READ,
    GRANULAR_PERMISSIONS.SOLICITUDES_COMMENT,
    GRANULAR_PERMISSIONS.MEETINGS_READ,
    GRANULAR_PERMISSIONS.REPORTS_VIEW,
    GRANULAR_PERMISSIONS.DOCUMENTS_READ,
    GRANULAR_PERMISSIONS.FICHAS_READ,
  ],
  
  // Consulta - Solo lectura
  'consulta': [
    GRANULAR_PERMISSIONS.SOLICITUDES_READ,
    GRANULAR_PERMISSIONS.MEETINGS_READ,
    GRANULAR_PERMISSIONS.REPORTS_VIEW,
  ],
};

// Función para verificar si un usuario tiene un permiso específico
export function hasGranularPermission(userRole: string, permission: GranularPermission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

// Función para verificar múltiples permisos (requiere todos)
export function hasAllPermissions(userRole: string, permissions: GranularPermission[]): boolean {
  return permissions.every(p => hasGranularPermission(userRole, p));
}

// Función para verificar múltiples permisos (requiere al menos uno)
export function hasAnyPermission(userRole: string, permissions: GranularPermission[]): boolean {
  return permissions.some(p => hasGranularPermission(userRole, p));
}

// Obtener todos los permisos de un rol
export function getRolePermissions(role: string): GranularPermission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Obtener todos los permisos disponibles en el sistema
export function getAllPermissions(): GranularPermission[] {
  return Object.values(GRANULAR_PERMISSIONS);
}

// Agrupar permisos por recurso para mostrar en UI
export function getPermissionsByResource(): Record<string, GranularPermission[]> {
  const grouped: Record<string, GranularPermission[]> = {};
  
  Object.values(GRANULAR_PERMISSIONS).forEach(permission => {
    const [resource] = permission.split('.');
    if (!grouped[resource]) {
      grouped[resource] = [];
    }
    grouped[resource].push(permission);
  });
  
  return grouped;
}