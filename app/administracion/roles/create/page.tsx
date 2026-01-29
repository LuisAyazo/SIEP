'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Interfaz para el formulario de creación de rol
interface RoleFormInputs {
  name: string;
  description: string;
  permissions: string[];
}

// Lista de permisos disponibles
const availablePermissions = [
  // Permisos de usuarios
  { id: 'users.create', name: 'Crear usuarios', description: 'Permite crear nuevos usuarios en el sistema', group: 'Usuarios' },
  { id: 'users.read', name: 'Ver usuarios', description: 'Permite ver la información de usuarios', group: 'Usuarios' },
  { id: 'users.update', name: 'Modificar usuarios', description: 'Permite actualizar la información de usuarios', group: 'Usuarios' },
  { id: 'users.delete', name: 'Eliminar usuarios', description: 'Permite eliminar usuarios del sistema', group: 'Usuarios' },
  
  // Permisos de roles
  { id: 'roles.create', name: 'Crear roles', description: 'Permite crear nuevos roles en el sistema', group: 'Roles' },
  { id: 'roles.read', name: 'Ver roles', description: 'Permite ver la información de roles', group: 'Roles' },
  { id: 'roles.update', name: 'Modificar roles', description: 'Permite actualizar la información de roles', group: 'Roles' },
  { id: 'roles.delete', name: 'Eliminar roles', description: 'Permite eliminar roles del sistema', group: 'Roles' },
  
  // Permisos de formularios
  { id: 'forms.create', name: 'Crear fichas', description: 'Permite crear nuevas fichas en el sistema', group: 'Fichas' },
  { id: 'forms.read', name: 'Ver fichas', description: 'Permite ver la información de fichas', group: 'Fichas' },
  { id: 'forms.update', name: 'Modificar fichas', description: 'Permite actualizar la información de fichas', group: 'Fichas' },
  { id: 'forms.delete', name: 'Eliminar fichas', description: 'Permite eliminar fichas del sistema', group: 'Fichas' },
  
  // Permisos de Operación
  { id: 'documents.create', name: 'Crear documentos', description: 'Permite crear nuevos documentos', group: 'Operación' },
  { id: 'documents.read', name: 'Ver documentos', description: 'Permite ver documentos', group: 'Operación' },
  { id: 'documents.update', name: 'Modificar documentos', description: 'Permite actualizar documentos', group: 'Operación' },
  { id: 'documents.delete', name: 'Eliminar documentos', description: 'Permite eliminar documentos', group: 'Operación' },
  
  { id: 'history.read', name: 'Ver historial', description: 'Permite ver el historial de cambios', group: 'Operación' },
  { id: 'history.export', name: 'Exportar historial', description: 'Permite exportar el historial de cambios', group: 'Operación' },
  
  // Permisos de Financiero
  { id: 'budget.create', name: 'Crear presupuesto', description: 'Permite crear nuevos presupuestos', group: 'Financiero' },
  { id: 'budget.read', name: 'Ver presupuesto', description: 'Permite ver información de presupuestos', group: 'Financiero' },
  { id: 'budget.update', name: 'Modificar presupuesto', description: 'Permite actualizar presupuestos', group: 'Financiero' },
  { id: 'budget.delete', name: 'Eliminar presupuesto', description: 'Permite eliminar presupuestos', group: 'Financiero' },
  
  { id: 'financial.tracking', name: 'Seguimiento financiero', description: 'Permite realizar seguimiento financiero', group: 'Financiero' },
  { id: 'financial.advanced', name: 'Funciones avanzadas', description: 'Permite usar funciones financieras avanzadas', group: 'Financiero' },
  
  // Permisos de informes y estadísticas
  { id: 'reports.basic', name: 'Informes básicos', description: 'Permite ver informes básicos', group: 'Informes' },
  { id: 'reports.advanced', name: 'Informes avanzados', description: 'Permite ver informes avanzados y estadísticas', group: 'Informes' },
  { id: 'reports.export', name: 'Exportar informes', description: 'Permite exportar informes a Excel y PDF', group: 'Informes' },
];

export default function CreateRolePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<RoleFormInputs>({
    defaultValues: {
      permissions: []
    }
  });
  
  // Agrupamos los permisos por categoría
  const permissionGroups = availablePermissions.reduce<Record<string, typeof availablePermissions>>((acc, permission) => {
    if (!acc[permission.group]) {
      acc[permission.group] = [];
    }
    acc[permission.group].push(permission);
    return acc;
  }, {});
  
  // Para ver los permisos seleccionados
  const selectedPermissions = watch('permissions') || [];
  
  // Función para seleccionar/deseleccionar todos los permisos de un grupo
  const toggleGroupPermissions = (group: string, isChecked: boolean) => {
    const groupPermissionIds = permissionGroups[group].map(p => p.id);
    
    if (isChecked) {
      // Añadir todos los permisos del grupo que no estén ya seleccionados
      const newPermissions = [...new Set([...selectedPermissions, ...groupPermissionIds])];
      setValue('permissions', newPermissions);
    } else {
      // Eliminar todos los permisos del grupo
      const newPermissions = selectedPermissions.filter(p => !groupPermissionIds.includes(p));
      setValue('permissions', newPermissions);
    }
  };

  // Verificar si todos los permisos de un grupo están seleccionados
  const isGroupFullySelected = (group: string) => {
    const groupPermissionIds = permissionGroups[group].map(p => p.id);
    return groupPermissionIds.every(p => selectedPermissions.includes(p));
  };

  // Verificar si algún permiso de un grupo está seleccionado
  const isGroupPartiallySelected = (group: string) => {
    const groupPermissionIds = permissionGroups[group].map(p => p.id);
    return groupPermissionIds.some(p => selectedPermissions.includes(p)) && 
           !groupPermissionIds.every(p => selectedPermissions.includes(p));
  };

  // Función para manejar el envío del formulario
  const onSubmit: SubmitHandler<RoleFormInputs> = async (data) => {
    try {
      setIsSubmitting(true);
      setError('');
      
      // En una implementación real, aquí se enviarían los datos al backend
      console.log('Datos del rol a crear:', data);
      
      // Simulación de envío al API
      setTimeout(() => {
        setIsSubmitting(false);
        router.push('/administracion/roles');
      }, 1000);
      
    } catch (err) {
      setError('Ha ocurrido un error al crear el rol.');
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Crear Nuevo Rol</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Define un nuevo rol con permisos personalizados</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/administracion/roles"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Volver
            </Link>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Información básica del rol */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Información básica</h3>
            <div className="mt-5 grid grid-cols-1 gap-y-6 sm:grid-cols-6">
              {/* Nombre del rol */}
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del rol <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="name"
                    className={`shadow-sm block w-full sm:text-sm rounded-md dark:bg-gray-700 dark:text-white ${
                      errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600 focus:ring-amber-500 focus:border-amber-500'
                    }`}
                    {...register('name', { 
                      required: 'El nombre del rol es obligatorio',
                      pattern: {
                        value: /^[a-zA-Z0-9_.-]+$/,
                        message: 'El nombre solo puede contener letras, números, guiones y puntos'
                      }
                    })}
                  />
                  {errors.name && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Utiliza un nombre descriptivo y único para identificar este rol en el sistema.
                </p>
              </div>

              {/* Descripción */}
              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    rows={3}
                    className={`shadow-sm block w-full sm:text-sm rounded-md dark:bg-gray-700 dark:text-white ${
                      errors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600 focus:ring-amber-500 focus:border-amber-500'
                    }`}
                    {...register('description', { 
                      required: 'La descripción es obligatoria',
                      minLength: {
                        value: 10,
                        message: 'La descripción debe tener al menos 10 caracteres'
                      }
                    })}
                  />
                  {errors.description && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Describe brevemente el propósito de este rol y qué tipo de usuarios deberían tenerlo asignado.
                </p>
              </div>
            </div>
          </div>

          {/* Selección de permisos */}
          <div className="pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Permisos</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Selecciona los permisos que tendrán los usuarios con este rol.
            </p>
            
            {errors.permissions && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.permissions.message}</p>
            )}
            
            <div className="mt-5 space-y-6">
              {/* Mostrar permisos agrupados por categorías */}
              {Object.keys(permissionGroups).map((group) => (
                <div key={group} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                  <div className="flex items-center mb-4">
                    <input
                      id={`group-${group}`}
                      type="checkbox"
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600"
                      checked={isGroupFullySelected(group)}
                      onChange={(e) => toggleGroupPermissions(group, e.target.checked)}
                      // Si hay algunos seleccionados pero no todos, mostramos como indeterminado
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = isGroupPartiallySelected(group);
                        }
                      }}
                    />
                    <label htmlFor={`group-${group}`} className="ml-2 block text-sm font-medium text-gray-900 dark:text-white">
                      {group} (Todos)
                    </label>
                  </div>
                  
                  <div className="ml-6 space-y-4">
                    {permissionGroups[group].map((permission) => (
                      <div key={permission.id} className="relative flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id={permission.id}
                            type="checkbox"
                            className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600"
                            value={permission.id}
                            {...register('permissions', {
                              required: 'Debe seleccionar al menos un permiso'
                            })}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor={permission.id} className="font-medium text-gray-700 dark:text-gray-300">{permission.name}</label>
                          <p className="text-gray-500 dark:text-gray-400">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen de permisos seleccionados */}
            <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Permisos seleccionados ({selectedPermissions.length})</h4>
              {selectedPermissions.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedPermissions.map((permissionId) => {
                    const permission = availablePermissions.find(p => p.id === permissionId);
                    return (
                      <span
                        key={permissionId}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200"
                      >
                        {permission?.name || permissionId}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No hay permisos seleccionados</p>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-5">
            <Link
              href="/administracion/roles"
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando...
                </>
              ) : 'Crear Rol'}
            </button>
          </div>
        </form>
      </div>

      {/* Panel explicativo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Guía para la creación de roles</h3>
        <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
          <p>
            Al crear un nuevo rol, tenga en cuenta las siguientes recomendaciones:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Asigne un nombre descriptivo que refleje claramente la función del rol</li>
            <li>Elija cuidadosamente los permisos necesarios, evitando dar más privilegios de los necesarios</li>
            <li>Los permisos se agrupan por categorías para facilitar su selección</li>
            <li>Puede seleccionar/deseleccionar todos los permisos de una categoría usando la casilla de verificación principal</li>
            <li>El panel de "Permisos seleccionados" muestra un resumen de los permisos elegidos</li>
          </ul>
        </div>
        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                <strong>Atención:</strong> Recuerde que asignar demasiados permisos puede comprometer la seguridad del sistema.
                Siga el principio de privilegio mínimo y otorgue solo los permisos necesarios.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}