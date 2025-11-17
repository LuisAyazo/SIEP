'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { usePermission } from '@/app/auth/hooks';
import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';
import PermissionGuard from '@/components/PermissionGuard';

// Definición de permisos disponibles por categoría (sincronizado con la página de roles)
const availablePermissions = {
  'Usuarios': [
    { id: 'users.create', label: 'Crear usuarios' },
    { id: 'users.read', label: 'Ver usuarios' },
    { id: 'users.update', label: 'Editar usuarios' },
    { id: 'users.delete', label: 'Eliminar usuarios' }
  ],
  'Roles': [
    { id: 'roles.create', label: 'Crear roles' },
    { id: 'roles.read', label: 'Ver roles' },
    { id: 'roles.update', label: 'Editar roles' },
    { id: 'roles.delete', label: 'Eliminar roles' }
  ],
  'Solicitudes': [
    { id: 'solicitudes.create', label: 'Crear solicitudes' },
    { id: 'solicitudes.read', label: 'Ver solicitudes' },
    { id: 'solicitudes.update', label: 'Editar solicitudes' },
    { id: 'solicitudes.delete', label: 'Eliminar solicitudes' },
    { id: 'solicitudes.approve', label: 'Aprobar solicitudes' },
    { id: 'solicitudes.reject', label: 'Rechazar solicitudes' },
    { id: 'solicitudes.assign', label: 'Asignar solicitudes' },
    { id: 'solicitudes.comment', label: 'Comentar en solicitudes' },
    { id: 'solicitudes.upload_files', label: 'Subir archivos Excel' },
    { id: 'solicitudes.send_to_group', label: 'Enviar al grupo revisor' }
  ],
  'Reuniones': [
    { id: 'meetings.create', label: 'Crear reuniones' },
    { id: 'meetings.read', label: 'Ver reuniones' },
    { id: 'meetings.update', label: 'Editar reuniones' },
    { id: 'meetings.delete', label: 'Eliminar reuniones' }
  ],
  'Reportes': [
    { id: 'reports.own', label: 'Ver propios reportes' },
    { id: 'reports.basic', label: 'Ver reportes básicos' },
    { id: 'reports.center', label: 'Ver reportes del centro' },
    { id: 'reports.all', label: 'Ver todos los reportes' },
    { id: 'reports.view', label: 'Visualizar reportes' }
  ],
  'Sistema': [
    { id: 'centers.manage', label: 'Gestionar centros' },
    { id: 'budget.read', label: 'Ver presupuestos' },
    { id: 'system.configure', label: 'Configurar sistema' }
  ]
};

export default function EditRolePage() {
  const params = useParams();
  const router = useRouter();
  const centerSlug = params.centerSlug as string;
  const roleId = params.id as string;

  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Cargar datos del rol
    const loadRole = async () => {
      setIsLoading(true);
      try {
        // En producción, esto vendría de la API
        // Simulación con los 6 roles del sistema con permisos completos
        const rolesMock = [
          {
            id: '1',
            name: 'administrador',
            description: 'Acceso completo a todas las funcionalidades del sistema. Puede gestionar usuarios, roles, solicitudes y configuraciones.',
            permissions: [
              'users.create', 'users.read', 'users.update', 'users.delete',
              'roles.create', 'roles.read', 'roles.update', 'roles.delete',
              'solicitudes.create', 'solicitudes.read', 'solicitudes.update', 'solicitudes.delete',
              'solicitudes.approve', 'solicitudes.reject', 'solicitudes.assign',
              'solicitudes.comment', 'solicitudes.upload_files', 'solicitudes.send_to_group',
              'meetings.create', 'meetings.read', 'meetings.update', 'meetings.delete',
              'centers.manage', 'reports.all', 'reports.view', 'system.configure', 'budget.read'
            ]
          },
          {
            id: '2',
            name: 'director_centro',
            description: 'Director con permisos administrativos del centro. Aprueba/rechaza solicitudes y gestiona el equipo del centro.',
            permissions: [
              'users.read', 'users.update',
              'solicitudes.read', 'solicitudes.approve', 'solicitudes.reject',
              'solicitudes.assign', 'solicitudes.send_to_group', 'solicitudes.comment',
              'meetings.create', 'meetings.read', 'meetings.update',
              'reports.center', 'reports.view', 'budget.read'
            ]
          },
          {
            id: '3',
            name: 'funcionario',
            description: 'Usuario estándar que crea y gestiona solicitudes de fichas técnicas, programas y convenios.',
            permissions: [
              'solicitudes.create', 'solicitudes.read', 'solicitudes.update',
              'solicitudes.comment', 'solicitudes.upload_files',
              'meetings.read', 'reports.own', 'reports.view'
            ]
          },
          {
            id: '4',
            name: 'operacion',
            description: 'Acceso a operaciones básicas del sistema sin permisos administrativos.',
            permissions: [
              'solicitudes.read', 'solicitudes.comment',
              'meetings.read', 'reports.basic', 'reports.view'
            ]
          },
          {
            id: '5',
            name: 'consulta',
            description: 'Acceso de solo lectura. Puede visualizar información sin realizar modificaciones.',
            permissions: [
              'solicitudes.read', 'meetings.read', 'reports.view'
            ]
          },
          {
            id: '6',
            name: 'coordinador_centro',
            description: 'Coordinador con permisos específicos para gestionar actividades y procesos del centro.',
            permissions: [
              'solicitudes.read', 'solicitudes.comment',
              'meetings.create', 'meetings.read', 'meetings.update',
              'reports.center', 'reports.view'
            ]
          }
        ];
        
        const role = rolesMock.find(r => r.id === roleId);
        if (role) {
          setRoleName(role.name);
          setDescription(role.description);
          setSelectedPermissions(role.permissions);
        } else {
          setError('Rol no encontrado');
        }
      } catch (err) {
        setError('Error al cargar el rol');
      } finally {
        setIsLoading(false);
      }
    };

    loadRole();
  }, [roleId]);

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      // En producción, aquí iría la llamada al API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirigir a la lista de roles
      router.push(`/center/${centerSlug}/dashboard/roles`);
    } catch (err) {
      setError('Error al actualizar el rol');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-b-2 border-amber-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <PermissionGuard
      resource={RESOURCES.ROLES}
      requiredPermission={PermissionLevel.WRITE}
      redirectTo="/dashboard"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-8"
        >
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Editar Rol</h1>
            <p className="text-gray-600 mt-2">Modifica los permisos y características del rol</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre del Rol */}
            <div>
              <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Rol
              </label>
              <input
                type="text"
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                placeholder="ej: gerente"
                required
                disabled
              />
              <p className="mt-1 text-sm text-gray-500">Los roles del sistema no pueden cambiar de nombre</p>
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                placeholder="Describe las responsabilidades de este rol..."
                required
              />
            </div>

            {/* Permisos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Permisos Asignados ({selectedPermissions.length})
              </label>
              
              <div className="space-y-6">
                {Object.entries(availablePermissions).map(([category, permissions]) => (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              {permission.label}
                            </span>
                            <div className="text-xs text-gray-500">{permission.id}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push(`/center/${centerSlug}/dashboard/roles`)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-md hover:bg-amber-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-5 w-5 border-b-2 border-white rounded-full"
                    />
                    Guardando...
                  </span>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </PermissionGuard>
  );
}