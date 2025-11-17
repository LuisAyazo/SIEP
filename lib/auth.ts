// Función para verificar si un usuario tiene acceso de administrador
export const hasAdminAccess = (role: string | null) => {
  return role === 'administrador' || role === 'director_centro';
};
