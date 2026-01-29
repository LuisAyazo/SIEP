'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { usePermission } from '@/app/auth/hooks';
import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';
import PermissionGuard from '@/components/PermissionGuard';
import { createClient } from '@/lib/supabase/client';

// Definición de los 6 roles del sistema SIEP
const rolesMock = [
  {
    id: '1',
    name: 'administrador',
    displayName: 'Administrador',
    description: 'Acceso completo a todas las funcionalidades del sistema',
    permissions: [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'roles.create', 'roles.read', 'roles.update', 'roles.delete',
      'solicitudes.create', 'solicitudes.read', 'solicitudes.update', 'solicitudes.delete',
      'solicitudes.approve', 'solicitudes.reject', 'solicitudes.assign',
      'meetings.create', 'meetings.read', 'meetings.update', 'meetings.delete',
      'centers.manage', 'reports.all', 'system.configure'
    ],
    userCount: 1,
    isSystem: true,
    created_at: '2025-04-01T10:00:00Z'
  },
  {
    id: '2',
    name: 'director_centro',
    displayName: 'Director de Centro',
    description: 'Aprueba/rechaza solicitudes y gestiona el equipo del centro',
    permissions: [
      'users.read', 'users.update',
      'solicitudes.read', 'solicitudes.approve', 'solicitudes.reject',
      'solicitudes.assign', 'solicitudes.send_to_group',
      'meetings.create', 'meetings.read', 'meetings.update',
      'reports.center', 'budget.read'
    ],
    userCount: 1,
    isSystem: true,
    created_at: '2025-04-01T10:00:00Z'
  },
  {
    id: '3',
    name: 'funcionario',
    displayName: 'Funcionario',
    description: 'Crea y gestiona solicitudes de fichas técnicas y programas',
    permissions: [
      'solicitudes.create', 'solicitudes.read', 'solicitudes.update',
      'solicitudes.comment', 'solicitudes.upload_files',
      'meetings.read', 'reports.own'
    ],
    userCount: 3,
    isSystem: true,
    created_at: '2025-04-01T10:00:00Z'
  },
  {
    id: '4',
    name: 'operacion',
    displayName: 'Operación',
    description: 'Acceso a operaciones básicas del sistema',
    permissions: [
      'solicitudes.read', 'solicitudes.comment',
      'meetings.read', 'reports.basic'
    ],
    userCount: 1,
    isSystem: true,
    created_at: '2025-04-01T10:00:00Z'
  },
  {
    id: '5',
    name: 'consulta',
    displayName: 'Consulta',
    description: 'Acceso de solo lectura sin modificaciones',
    permissions: [
      'solicitudes.read', 'meetings.read', 'reports.view'
    ],
    userCount: 1,
    isSystem: true,
    created_at: '2025-04-01T10:00:00Z'
  },
  {
    id: '6',
    name: 'coordinador_centro',
    displayName: 'Coordinador de Centro',
    description: 'Gestiona actividades y procesos del centro',
    permissions: [
      'solicitudes.read', 'solicitudes.comment',
      'meetings.create', 'meetings.read', 'meetings.update',
      'reports.center'
    ],
    userCount: 1,
    isSystem: true,
    created_at: '2025-04-01T10:00:00Z'
  }
];

export default function RolesAdminPage() {
  const [roles, setRoles] = useState(rolesMock);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // Obtener roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (rolesError) throw rolesError;

      // Obtener conteo de usuarios por rol
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('role_id');

      if (userRolesError) {
        console.error('Error al obtener user_roles:', userRolesError);
      }

      // Contar usuarios por rol
      const userCountByRole: Record<string, number> = {};
      userRolesData?.forEach((ur: any) => {
        userCountByRole[ur.role_id] = (userCountByRole[ur.role_id] || 0) + 1;
      });

      const transformedRoles = rolesData?.map(role => ({
        id: role.id,
        name: role.name,
        displayName: role.display_name || role.name,
        description: role.description || '',
        permissions: role.permissions || [],
        userCount: userCountByRole[role.id] || 0,
        isSystem: true,
        created_at: role.created_at
      })) || [];

      setRoles(transformedRoles);
      setError('');
    } catch (err: any) {
      console.error('[RolesPage] Error al cargar roles:', err);
      setError('Error al cargar los roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const roleToDelete = roles.find(role => role.id === roleId);
    
    if (roleToDelete?.isSystem) {
      alert('Este rol es esencial para el sistema y no puede ser eliminado.');
      return;
    }
    
    if (window.confirm('¿Estás seguro de que deseas eliminar este rol?')) {
      setIsLoading(true);
      try {
        setRoles(roles.filter(role => role.id !== roleId));
        setError('');
      } catch (err) {
        setError('Error al eliminar el rol');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <PermissionGuard
      resource={RESOURCES.ROLES}
      requiredPermission={PermissionLevel.READ}
      redirectTo="/dashboard"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles del Sistema</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {roles.length} roles • {roles.reduce((acc, role) => acc + role.userCount, 0)} usuarios
            </p>
          </div>
          <Link
            href="/administracion/roles/create"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Crear Rol
          </Link>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Roles Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Usuarios
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Permisos
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {roles.map((role) => (
                <React.Fragment key={role.id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {role.displayName}
                        </div>
                        {role.isSystem && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            Sistema
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                        {role.description}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {role.userCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedRole(selectedRole === role.id ? null : role.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {role.permissions.length}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/administracion/roles/edit/${role.name}`}
                          className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          disabled={role.isSystem}
                          className={`p-1.5 rounded transition-colors ${
                            role.isSystem
                              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              : 'text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          title={role.isSystem ? 'Rol del sistema no eliminable' : 'Eliminar'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Permissions Expandable Row */}
                  <AnimatePresence>
                    {selectedRole === role.id && (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-gray-50 dark:bg-gray-900/50"
                      >
                        <td colSpan={5} className="px-4 py-3">
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
                            Permisos asignados:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {role.permissions.map((perm, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800"
                              >
                                {perm}
                              </span>
                            ))}
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PermissionGuard>
  );
}
