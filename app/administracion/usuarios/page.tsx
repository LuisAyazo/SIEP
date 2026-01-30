'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { usePermission } from '@/app/auth/hooks';
import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';
import PermissionGuard from '@/components/PermissionGuard';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  centers?: Array<{ id: string; name: string; slug: string }>;
}

interface Center {
  id: string;
  name: string;
  slug: string;
}

// Role descriptions
const roleDescriptions = {
  administrador: { title: 'Administrador', color: 'amber' },
  director_centro: { title: 'Director de Centro', color: 'purple' },
  funcionario: { title: 'Funcionario', color: 'indigo' },
  operacion: { title: 'Operación', color: 'green' },
  consulta: { title: 'Consulta', color: 'blue' },
  coordinador_centro: { title: 'Coordinador de Centro', color: 'teal' }
};

export default function UsuariosAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const hasPermission = usePermission(RESOURCES.USERS, PermissionLevel.READ);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  // Modal states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [availableCenters, setAvailableCenters] = useState<Center[]>([]);
  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!hasPermission) return;
      
      setIsLoading(true);
      try {
        const supabase = createClient();
        
        // Fetch users
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
            ),
            user_centers (
              centers (
                id,
                name,
                slug
              )
            )
          `);

        if (usersError) throw usersError;

        // Fetch all centers
        const { data: centersData, error: centersError } = await supabase
          .from('centers')
          .select('id, name, slug')
          .order('name');

        if (centersError) throw centersError;

        setAvailableCenters(centersData || []);

        const transformedUsers = usersData?.map((user: any) => {
          const roles = user.user_roles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];
          
          let primaryRole = 'consulta';
          if (roles.length > 0) {
            const specificRole = roles.find((r: string) => r !== 'funcionario');
            primaryRole = specificRole || roles[0];
          }
          
          const centers = user.user_centers?.map((uc: any) => uc.centers).filter(Boolean) || [];
          
          return {
            id: user.id,
            username: user.email?.split('@')[0] || '',
            email: user.email || '',
            full_name: user.full_name || 'Sin nombre',
            role: primaryRole,
            created_at: user.created_at,
            centers: centers
          };
        }) || [];

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
  }, []);

  const handleOpenEditCenters = (user: User) => {
    setEditingUserId(user.id);
    setSelectedCenters(user.centers?.map(c => c.id) || []);
  };

  const handleToggleCenter = (centerId: string) => {
    setSelectedCenters(prev =>
      prev.includes(centerId)
        ? prev.filter(id => id !== centerId)
        : [...prev, centerId]
    );
  };

  const handleSaveCenters = async () => {
    if (!editingUserId) return;

    setIsSaving(true);
    try {
      const supabase = createClient();

      // Delete existing assignments
      await supabase
        .from('user_centers')
        .delete()
        .eq('user_id', editingUserId);

      // Insert new assignments
      if (selectedCenters.length > 0) {
        const assignments = selectedCenters.map(centerId => ({
          user_id: editingUserId,
          center_id: centerId
        }));

        const { error: insertError } = await supabase
          .from('user_centers')
          .insert(assignments);

        if (insertError) throw insertError;
      }

      // Update local state
      setUsers(prev => prev.map(user => {
        if (user.id === editingUserId) {
          return {
            ...user,
            centers: availableCenters.filter(c => selectedCenters.includes(c.id))
          };
        }
        return user;
      }));

      setEditingUserId(null);
      setSelectedCenters([]);
      setError('');
    } catch (err: any) {
      console.error('Error al actualizar centros:', err);
      setError('Error al actualizar los centros: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.admin.deleteUser(id);
      
      if (error) throw error;
      
      setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
      setError('');
    } catch (err: any) {
      console.error('Error al eliminar usuario:', err);
      setError('Error al eliminar el usuario: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const roleCount = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [users]);

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
  
  return (
    <PermissionGuard
      resource={RESOURCES.USERS}
      requiredPermission={PermissionLevel.READ}
      redirectTo="/dashboard"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios del Sistema</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {users.length} usuarios registrados
            </p>
          </div>
          <Link
            href="/administracion/usuarios/create"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Crear Usuario
          </Link>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                className="pl-9 pr-4 py-2 w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Buscar por nombre, email o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Centros
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.full_name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded
                          ${user.role === 'administrador' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                            user.role === 'director_centro' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                            user.role === 'funcionario' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' :
                            user.role === 'operacion' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            user.role === 'coordinador_centro' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                          {roleDescriptions[user.role as keyof typeof roleDescriptions]?.title || user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {user.centers && user.centers.length > 0 ? (
                            <button
                              onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {user.centers.length}
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">0</span>
                          )}
                          <button
                            onClick={() => handleOpenEditCenters(user)}
                            className="p-1 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Editar centros"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/administracion/usuarios/edit/${user.id}`}
                            className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isLoading}
                            className="p-1.5 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                            title="Eliminar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Centers Expandable Row */}
                    <AnimatePresence>
                      {selectedUser === user.id && user.centers && user.centers.length > 0 && (
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="bg-gray-50 dark:bg-gray-900/50"
                        >
                          <td colSpan={6} className="px-4 py-3">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
                              Centros asignados:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {user.centers.map((center) => (
                                <span
                                  key={center.id}
                                  className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800"
                                >
                                  {center.name}
                                </span>
                              ))}
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
                
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No se encontraron usuarios con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Edit Centers Modal */}
        <AnimatePresence>
          {editingUserId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Editar Centros Asignados
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {users.find(u => u.id === editingUserId)?.full_name}
                  </p>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
                  <div className="space-y-2">
                    {availableCenters.map((center) => (
                      <label
                        key={center.id}
                        className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCenters.includes(center.id)}
                          onChange={() => handleToggleCenter(center.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-900 dark:text-white">
                          {center.name}
                        </span>
                      </label>
                    ))}
                  </div>

                  {availableCenters.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                      No hay centros disponibles
                    </p>
                  )}
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setEditingUserId(null);
                      setSelectedCenters([]);
                    }}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveCenters}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving && (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PermissionGuard>
  );
}
