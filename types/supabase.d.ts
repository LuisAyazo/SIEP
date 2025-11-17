import { Database as DatabaseGenerated } from './database.types'

export type Database = DatabaseGenerated

// Tipos de las tablas
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Role = Database['public']['Tables']['roles']['Row']
export type UserRole = Database['public']['Tables']['user_roles']['Row']
export type Center = Database['public']['Tables']['centers']['Row']
export type UserCenter = Database['public']['Tables']['user_centers']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Budget = Database['public']['Tables']['budgets']['Row']

// Tipos para inserts
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type RoleInsert = Database['public']['Tables']['roles']['Insert']
export type CenterInsert = Database['public']['Tables']['centers']['Insert']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type BudgetInsert = Database['public']['Tables']['budgets']['Insert']

// Tipos para updates
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type RoleUpdate = Database['public']['Tables']['roles']['Update']
export type CenterUpdate = Database['public']['Tables']['centers']['Update']
export type DocumentUpdate = Database['public']['Tables']['documents']['Update']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']
export type BudgetUpdate = Database['public']['Tables']['budgets']['Update']

// Enums de roles
export enum UserRoleEnum {
  ADMINISTRADOR = 'administrador',
  FUNCIONARIO = 'funcionario',
  DIRECTOR_DE_CENTRO = 'director_de_centro',
}

// Tipo para usuario con roles y centros
export interface UserWithRoles extends Profile {
  roles?: Role[]
  centers?: Center[]
}

// Tipo para sesión de usuario
export interface UserSession {
  user: {
    id: string
    email: string
    role?: UserRoleEnum
    roles?: Role[]
    centers?: Center[]
  }
}

// Permisos
export type Permission = 
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'centers:read'
  | 'centers:write'
  | 'centers:delete'
  | 'roles:read'
  | 'roles:write'
  | 'roles:delete'
  | 'documents:read'
  | 'documents:write'
  | 'documents:delete'
  | 'fichas:read'
  | 'fichas:write'
  | 'fichas:delete'
  | 'reports:read'
  | 'reports:write'
  | 'settings:read'
  | 'settings:write'