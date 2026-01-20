'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { usePermission } from '@/app/auth/hooks';
import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';
import PermissionGuard from '@/components/PermissionGuard';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

// Role descriptions for the role summary cards
const roleDescriptions = {
  administrador: {
    title: 'Administrador',
    description: 'Acceso completo a todas las funcionalidades del sistema, incluyendo gestión de usuarios y configuraciones.',
    color: 'amber',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
      </svg>
    )
  },
  director_centro: {
    title: 'Director de Centro',
    description: 'Director de centro universitario con permisos administrativos para gestionar solicitudes y usuarios del centro.',
    color: 'purple',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
    )
  },
  funcionario: {
    title: 'Funcionario',
    description: 'Usuario estándar con permisos para crear y gestionar solicitudes de fichas técnicas y programas.',
    color: 'indigo',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    )
  },
  operacion: {
    title: 'Operación',
    description: 'Acceso a operaciones básicas del sistema, incluyendo formularios y procesos operativos.',
    color: 'green',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
      </svg>
    )
  },
  consulta: {
    title: 'Consulta',
    description: 'Acceso de solo lectura a información específica del sistema sin permisos de modificación.',
    color: 'blue',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
      </svg>
    )
  },
  coordinador_centro: {
    title: 'Coordinador de Centro',
    description: 'Coordinador con permisos específicos para gestionar actividades y procesos del centro.',
    color: 'teal',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
      </svg>
    )
  }
};

export default function UsersPage() {
  const params = useParams();
  const centerSlug = params.centerSlug as string;
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const hasPermission = usePermission(RESOURCES.USERS, PermissionLevel.READ);
  
  // New states for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showRoleSummary, setShowRoleSummary] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!hasPermission) return;
      
      setIsLoading(true);
      try {
        const supabase = createClient();
        
        // Obtener usuarios con sus roles
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            created_at,
            user_roles (
              roles (
                name
              )
            )
          `);

        if (usersError) throw usersError;

        // Transformar datos al formato esperado
        const transformedUsers = usersData?.map((user: any) => {
          // Obtener todos los roles del usuario
          const roles = user.user_roles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];
          
          // Debug: Ver los roles de cada usuario
          console.log(`Usuario ${user.email}: roles =`, roles);
          
          // Orden de prioridad: cualquier rol específico > funcionario > consulta
          let primaryRole = 'consulta';
          if (roles.length > 0) {
            // Buscar cualquier rol que NO sea 'funcionario'
            const specificRole = roles.find((r: string) => r !== 'funcionario');
            primaryRole = specificRole || roles[0];
          }
          
          console.log(`Usuario ${user.email}: rol asignado =`, primaryRole);
          
          return {
            id: user.id,
            username: user.email?.split('@')[0] || '',
            email: user.email || '',
            full_name: user.full_name || 'Sin nombre',
            role: primaryRole,
            created_at: user.created_at
          };
        }) || [];
        
        console.log('Usuarios transformados:', transformedUsers);

        setUsers(transformedUsers);
        setError('');
      } catch (err: any) {
        console.error('Error al cargar usuarios:', err);
        setError('Error al cargar los usuarios: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []); // Removido hasPermission de las dependencias para evitar loop infinito

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // Eliminar usuario de Supabase Auth (requiere permisos de administrador)
      const { error } = await supabase.auth.admin.deleteUser(id);
      
      if (error) throw error;
      
      // Actualizar lista local
      setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
      setError('');
    } catch (err: any) {
      console.error('Error al eliminar usuario:', err);
      setError('Error al eliminar el usuario: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get count of users by role
  const roleCount = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [users]);

  // Filter users based on search term and role filter
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);
  
  // Envolver todo en un PermissionGuard
  return (
    <PermissionGuard
      resource={RESOURCES.USERS}
      requiredPermission={PermissionLevel.READ}
      redirectTo="/dashboard"
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <Link href={`/center/${centerSlug}/users/create`}>
            <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md flex items-center shadow-md transition-all duration-200 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Crear Usuario
            </button>
          </Link>
        </div>

        {/* Role summary cards with animations */}
        {showRoleSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(roleDescriptions).map(([role, { title, description, color, icon }], index) => (
              <motion.div
                key={role}
                className={`bg-white rounded-lg shadow-md p-4 border-l-4 border-${color}-500 hover:shadow-lg transition-shadow`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start">
                  <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600 mr-4`}>
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                    <div className="mt-2 text-sm font-medium text-gray-800">
                      Usuarios: <span className={`text-${color}-600`}>{roleCount[role] || 0}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
              <p>{error}</p>
            </div>
          )}

          {/* Filter section */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                  placeholder="Buscar por nombre, email o usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">Todos los roles</option>
                <option value="administrador">Administrador</option>
                <option value="director_centro">Director de Centro</option>
                <option value="funcionario">Funcionario</option>
                <option value="operacion">Operación</option>
                <option value="consulta">Consulta</option>
                <option value="coordinador_centro">Coordinador de Centro</option>
              </select>

              <button
                onClick={() => setShowRoleSummary(!showRoleSummary)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                {showRoleSummary ? 'Ocultar resumen' : 'Mostrar resumen'}
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <motion.div
                animate={{
                  rotate: 360
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="h-12 w-12 border-b-2 border-amber-600 rounded-full"
              ></motion.div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo electrónico</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre completo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de creación</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user, index) => (
                    <motion.tr 
                      key={user.id} 
                      className="hover:bg-gray-50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${user.role === 'administrador' ? 'bg-amber-100 text-amber-800' :
                            user.role === 'director_centro' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'funcionario' ? 'bg-indigo-100 text-indigo-800' :
                            user.role === 'operacion' ? 'bg-green-100 text-green-800' :
                            user.role === 'coordinador_centro' ? 'bg-teal-100 text-teal-800' :
                            'bg-blue-100 text-blue-800'}`}>
                          {roleDescriptions[user.role as keyof typeof roleDescriptions]?.title || user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link href={`/center/${centerSlug}/users/edit/${user.id}`}>
                            <button className="text-amber-600 hover:text-amber-900" title="Editar usuario">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                          </Link>
                          <button 
                            className="text-red-600 hover:text-red-800" 
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isLoading}
                            title="Eliminar usuario"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No se encontraron usuarios con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
}