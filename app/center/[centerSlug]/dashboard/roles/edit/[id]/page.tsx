'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { usePermission } from '@/app/auth/hooks';
import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';
import PermissionGuard from '@/components/PermissionGuard';
import { createClient } from '@/lib/supabase/client';

// Definición de permisos disponibles por categoría (sincronizado con permissions-granular.ts)
const availablePermissions = {
  'Dashboard': [
    { id: 'dashboard.view', label: 'Ver dashboard' },
    { id: 'dashboard.view_all', label: 'Ver dashboard completo' }
  ],
  'Usuarios': [
    { id: 'users.create', label: 'Crear usuarios' },
    { id: 'users.read', label: 'Ver usuarios' },
    { id: 'users.update', label: 'Editar usuarios' },
    { id: 'users.delete', label: 'Eliminar usuarios' },
    { id: 'users.assign_roles', label: 'Asignar roles' },
    { id: 'users.manage_center', label: 'Gestionar usuarios del centro' }
  ],
  'Roles': [
    { id: 'roles.create', label: 'Crear roles' },
    { id: 'roles.read', label: 'Ver roles' },
    { id: 'roles.update', label: 'Editar roles' },
    { id: 'roles.delete', label: 'Eliminar roles' },
    { id: 'roles.assign', label: 'Asignar roles' }
  ],
  'Centros': [
    { id: 'centers.create', label: 'Crear centros' },
    { id: 'centers.read', label: 'Ver centros' },
    { id: 'centers.update', label: 'Editar centros' },
    { id: 'centers.delete', label: 'Eliminar centros' },
    { id: 'centers.manage', label: 'Gestionar centros' }
  ],
  'Configuración': [
    { id: 'settings.read', label: 'Ver configuración' },
    { id: 'settings.update', label: 'Actualizar configuración' }
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
    { id: 'solicitudes.upload_files', label: 'Subir archivos Excel' }
  ],
  'Comités': [
    { id: 'meetings.create', label: 'Crear comités' },
    { id: 'meetings.read', label: 'Ver comités' },
    { id: 'meetings.update', label: 'Editar comités' },
    { id: 'meetings.delete', label: 'Eliminar comités' },
    { id: 'meetings.manage_participants', label: 'Gestionar participantes' }
  ],
  'Fichas': [
    { id: 'fichas.create', label: 'Crear fichas' },
    { id: 'fichas.read', label: 'Ver fichas' },
    { id: 'fichas.update', label: 'Editar fichas' },
    { id: 'fichas.delete', label: 'Eliminar fichas' }
  ],
  'Gestión Documental': [
    { id: 'documents.create', label: 'Crear documentos' },
    { id: 'documents.read', label: 'Ver documentos' },
    { id: 'documents.update', label: 'Editar documentos' },
    { id: 'documents.delete', label: 'Eliminar documentos' },
    { id: 'documents.upload', label: 'Subir documentos' },
    { id: 'documents.download', label: 'Descargar documentos' }
  ],
  'Historial': [
    { id: 'history.read', label: 'Ver historial' },
    { id: 'history.view_all', label: 'Ver todo el historial' }
  ],
  'Reportes': [
    { id: 'reports.own', label: 'Ver propios reportes' },
    { id: 'reports.view', label: 'Visualizar reportes' },
    { id: 'reports.center', label: 'Ver reportes del centro' },
    { id: 'reports.all', label: 'Ver todos los reportes' },
    { id: 'reports.create', label: 'Crear reportes' },
    { id: 'reports.export', label: 'Exportar reportes' }
  ],
  'Presupuesto': [
    { id: 'budget.read', label: 'Ver presupuesto' },
    { id: 'budget.create', label: 'Crear presupuesto' },
    { id: 'budget.update', label: 'Actualizar presupuesto' },
    { id: 'budget.approve', label: 'Aprobar presupuesto' }
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
    // Cargar datos del rol desde Supabase usando el name
    const loadRole = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        
        console.log('[EditRolePage] 🔍 Iniciando carga del rol:', roleId);
        
        // El roleId en la URL es el nombre del rol (ej: "funcionario")
        const { data: role, error: roleError } = await supabase
          .from('roles')
          .select('*')
          .eq('name', roleId)
          .single();

        console.log('[EditRolePage] 📦 Respuesta de Supabase:', { role, error: roleError });

        if (roleError) throw roleError;

        if (role) {
          console.log('[EditRolePage] 📋 Permisos del rol:', role.permissions);
          console.log('[EditRolePage] 🔢 Tipo:', typeof role.permissions, 'Es array?', Array.isArray(role.permissions));
          
          setRoleName(role.name);
          setDescription(role.description || '');
          const perms = role.permissions || [];
          console.log('[EditRolePage] ✅ Estableciendo permisos:', perms);
          console.log('[EditRolePage] ✅ Cantidad:', perms.length);
          setSelectedPermissions(perms);
          
          // Log después de establecer el estado
          setTimeout(() => {
            console.log('[EditRolePage] 🎯 Estado después de setSelectedPermissions:', perms);
          }, 100);
        } else {
          setError('Rol no encontrado');
        }
      } catch (err: any) {
        console.error('[EditRolePage] ❌ Error al cargar rol:', err);
        setError(err.message || 'Error al cargar el rol');
      } finally {
        setIsLoading(false);
      }
    };

    loadRole();
  }, [roleId]);

  const togglePermission = (permissionId: string) => {
    console.log('[EditRolePage] 🔄 Toggling permission:', permissionId);
    setSelectedPermissions(prev => {
      console.log('[EditRolePage] 📝 Permisos antes:', prev, 'Cantidad:', prev.length);
      const newPerms = prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId];
      console.log('[EditRolePage] ✨ Permisos después:', newPerms, 'Cantidad:', newPerms.length);
      return newPerms;
    });
  };

  // Función para seleccionar/deseleccionar todos los permisos de una categoría
  const toggleAllInCategory = (category: string) => {
    const categoryPermissions = availablePermissions[category as keyof typeof availablePermissions];
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    const allSelected = categoryPermissionIds.every(id => selectedPermissions.includes(id));

    if (allSelected) {
      // Deseleccionar todos
      setSelectedPermissions(prev => prev.filter(id => !categoryPermissionIds.includes(id)));
    } else {
      // Seleccionar todos
      setSelectedPermissions(prev => {
        const newPerms = new Set([...prev, ...categoryPermissionIds]);
        return Array.from(newPerms);
      });
    }
  };

  // Verificar si todos los permisos de una categoría están seleccionados
  const isCategoryFullySelected = (category: string) => {
    const categoryPermissions = availablePermissions[category as keyof typeof availablePermissions];
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    return categoryPermissionIds.every(id => selectedPermissions.includes(id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    console.log('[EditRolePage] Iniciando guardado...');
    console.log('[EditRolePage] roleId:', roleId);
    console.log('[EditRolePage] description:', description);
    console.log('[EditRolePage] selectedPermissions:', selectedPermissions);
    console.log('[EditRolePage] Cantidad de permisos a guardar:', selectedPermissions.length);

    try {
      const supabase = createClient();
      
      // Actualizar el rol en la base de datos usando name
      const { data, error: updateError } = await supabase
        .from('roles')
        .update({
          description: description,
          permissions: selectedPermissions,
          updated_at: new Date().toISOString()
        })
        .eq('name', roleId); // Usar name en lugar de id

      console.log('[EditRolePage] Resultado de update:', { data, error: updateError });

      if (updateError) {
        throw updateError;
      }

      console.log('[EditRolePage] ✅ Guardado exitoso, redirigiendo...');
      // Redirigir a la lista de roles
      router.push(`/center/${centerSlug}/dashboard/roles`);
    } catch (err: any) {
      console.error('[EditRolePage] ❌ Error al actualizar:', err);
      setError(err.message || 'Error al actualizar el rol');
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-gray-900 bg-gray-50"
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
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{category}</h3>
                      <button
                        type="button"
                        onClick={() => toggleAllInCategory(category)}
                        className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
                      >
                        {isCategoryFullySelected(category) ? 'Deseleccionar todos' : 'Seleccionar todos'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permissions.map((permission) => {
                        const isChecked = selectedPermissions.includes(permission.id);
                        if (isChecked) {
                          console.log('[EditRolePage] ✓ Checkbox marcado:', permission.id);
                        }
                        return (
                          <label
                            key={permission.id}
                            className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
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
                        );
                      })}
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