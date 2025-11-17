'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
  
  // Permisos de formularios/fichas
  { id: 'forms.create', name: 'Crear fichas', description: 'Permite crear nuevas fichas en el sistema', group: 'Fichas' },
  { id: 'forms.read', name: 'Ver fichas', description: 'Permite ver la información de fichas', group: 'Fichas' },
  { id: 'forms.update', name: 'Modificar fichas', description: 'Permite actualizar la información de fichas', group: 'Fichas' },
  { id: 'forms.delete', name: 'Eliminar fichas', description: 'Permite eliminar fichas del sistema', group: 'Fichas' },
  
  // Permisos de Documentación
  { id: 'documents.create', name: 'Crear documentos', description: 'Permite crear nuevos documentos', group: 'Documentación' },
  { id: 'documents.read', name: 'Ver documentos', description: 'Permite ver documentos', group: 'Documentación' },
  { id: 'documents.update', name: 'Modificar documentos', description: 'Permite actualizar documentos', group: 'Documentación' },
  { id: 'documents.delete', name: 'Eliminar documentos', description: 'Permite eliminar documentos', group: 'Documentación' },
  
  // Permisos de Historial
  { id: 'history.read', name: 'Ver historial', description: 'Permite ver el historial de actividades', group: 'Historial' },
  { id: 'history.export', name: 'Exportar historial', description: 'Permite exportar el historial de actividades', group: 'Historial' },
  
  // Permisos de Proyectos
  { id: 'projects.create', name: 'Crear proyectos', description: 'Permite crear nuevos proyectos', group: 'Proyectos' },
  { id: 'projects.read', name: 'Ver proyectos', description: 'Permite ver proyectos', group: 'Proyectos' },
  { id: 'projects.update', name: 'Modificar proyectos', description: 'Permite actualizar proyectos', group: 'Proyectos' },
  { id: 'projects.delete', name: 'Eliminar proyectos', description: 'Permite eliminar proyectos', group: 'Proyectos' },
  
  // Permisos de Dashboard
  { id: 'dashboard.view', name: 'Ver dashboard', description: 'Permite ver el dashboard', group: 'Dashboard' },
  { id: 'dashboard.customize', name: 'Personalizar dashboard', description: 'Permite personalizar el dashboard', group: 'Dashboard' },
  
  // Permisos financieros
  { id: 'budget.create', name: 'Crear presupuestos', description: 'Permite crear presupuestos', group: 'Financiero' },
  { id: 'budget.read', name: 'Ver presupuestos', description: 'Permite ver presupuestos', group: 'Financiero' },
  { id: 'budget.update', name: 'Modificar presupuestos', description: 'Permite modificar presupuestos', group: 'Financiero' },
  { id: 'budget.delete', name: 'Eliminar presupuestos', description: 'Permite eliminar presupuestos', group: 'Financiero' },
  { id: 'financial_tracking.read', name: 'Ver seguimiento financiero', description: 'Permite ver seguimiento financiero', group: 'Financiero' },
  { id: 'financial_tracking.write', name: 'Actualizar seguimiento financiero', description: 'Permite actualizar seguimiento financiero', group: 'Financiero' },
  { id: 'financial_tracking.approve', name: 'Aprobar operaciones financieras', description: 'Permite aprobar operaciones financieras', group: 'Financiero' },
  
  // Permisos de informes y estadísticas
  { id: 'reports.basic', name: 'Informes básicos', description: 'Permite ver informes básicos', group: 'Informes' },
  { id: 'reports.advanced', name: 'Informes avanzados', description: 'Permite ver informes avanzados y estadísticas', group: 'Informes' },
  { id: 'reports.export', name: 'Exportar informes', description: 'Permite exportar informes a Excel y PDF', group: 'Informes' },
  { id: 'reports.create', name: 'Crear informes personalizados', description: 'Permite crear informes personalizados', group: 'Informes' },
  
  // Permisos de Excel/importación
  { id: 'excel.import', name: 'Importar datos Excel', description: 'Permite importar datos desde Excel', group: 'Excel' },
  { id: 'excel.export', name: 'Exportar datos Excel', description: 'Permite exportar datos a Excel', group: 'Excel' },
  { id: 'excel.templates', name: 'Gestionar plantillas Excel', description: 'Permite gestionar plantillas de Excel', group: 'Excel' },
];

export default function CreateRolePage() {
  const params = useParams();
  const centerSlug = params.centerSlug as string;
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
    return groupPermissionIds.some(p => selectedPermissions.includes(p)) && !groupPermissionIds.every(p => selectedPermissions.includes(p));
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
        router.push(`/center/${centerSlug}/dashboard/roles`);
      }, 1000);
      
    } catch (err) {
      setError('Ha ocurrido un error al crear el rol.');
      setIsSubmitting(false);
    }
  };

  // Variantes para las animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const checkboxVariants = {
    unchecked: { scale: 1 },
    checked: { scale: [1, 1.2, 1], transition: { duration: 0.2 } }
  };

  return (
    <motion.div 
      className="p-6 bg-white rounded-lg shadow-md"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="flex items-center mb-6">
        <motion.div 
          className="p-2 bg-amber-100 rounded-full mr-3"
          whileHover={{ rotate: 15, scale: 1.1 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo Rol</h1>
          <p className="text-gray-600 text-sm">Define un nuevo rol con permisos específicos para los usuarios del sistema</p>
        </div>
      </motion.div>
      
      {error && (
        <motion.div 
          className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p>{error}</p>
        </motion.div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6">
          <motion.div variants={itemVariants}>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Rol <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              {...register("name", { required: "El nombre del rol es obligatorio" })}
              className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md h-12"
              placeholder="Ej: Administrador de Documentos"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              {...register("description", { required: "La descripción es obligatoria" })}
              className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md h-24"
              placeholder="Describe las responsabilidades y alcance de este rol en el sistema"
            ></textarea>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permisos <span className="text-red-500">*</span>
            </label>
            
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Seleccione los permisos que desea asignar a este rol. Puede seleccionar permisos individuales o grupos completos.
                </p>
              </div>
              
              <div className="space-y-6">
                {Object.entries(permissionGroups).map(([group, permissions]) => (
                  <motion.div 
                    key={group} 
                    className="border border-gray-200 rounded-md overflow-hidden"
                    variants={itemVariants}
                  >
                    <div className="bg-gray-100 p-3 flex justify-between items-center">
                      <span className="font-medium text-gray-700">{group}</span>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50 h-5 w-5"
                          checked={isGroupFullySelected(group)}
                          ref={input => {
                            if (input) {
                              input.indeterminate = isGroupPartiallySelected(group);
                            }
                          }}
                          onChange={(e) => toggleGroupPermissions(group, e.target.checked)}
                        />
                        <motion.span 
                          className="ml-2 text-sm"
                          variants={checkboxVariants}
                          animate={isGroupFullySelected(group) ? "checked" : "unchecked"}
                        >
                          {isGroupFullySelected(group) ? 'Todos seleccionados' : isGroupPartiallySelected(group) ? 'Algunos seleccionados' : 'Seleccionar todos'}
                        </motion.span>
                      </label>
                    </div>
                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {permissions.map((permission) => (
                        <motion.div 
                          key={permission.id}
                          className="relative flex items-start"
                          whileHover={{ x: 5 }}
                        >
                          <div className="flex items-center h-5">
                            <motion.input
                              id={permission.id}
                              type="checkbox"
                              value={permission.id}
                              className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-200"
                              {...register("permissions")}
                              whileTap={{ scale: 1.2 }}
                              animate={
                                selectedPermissions.includes(permission.id) ? { scale: [1, 1.2, 1] } : {}
                              }
                              transition={{ duration: 0.2 }}
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor={permission.id} className="font-medium text-gray-700">
                              {permission.name}
                            </label>
                            <p className="text-gray-500 text-xs">{permission.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {errors.permissions && (
                <p className="mt-2 text-sm text-red-600">Debe seleccionar al menos un permiso</p>
              )}
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-700">Permisos seleccionados ({selectedPermissions.length})</h4>
              
              {selectedPermissions.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedPermissions.map((permissionId) => {
                    const permission = availablePermissions.find((p) => p.id === permissionId);
                    return (
                      <motion.span 
                        key={permissionId}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        {permission?.name || permissionId}
                      </motion.span>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500 italic">No hay permisos seleccionados</p>
              )}
            </div>
          </motion.div>
          
          <motion.div
            className="flex justify-end space-x-3 pt-5"
            variants={itemVariants}
          >
            <Link href={`/center/${centerSlug}/dashboard/roles`}>
              <motion.button
                type="button"
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancelar
              </motion.button>
            </Link>
            <motion.button
              type="submit"
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""}`}
              disabled={isSubmitting}
              whileHover={!isSubmitting ? { scale: 1.05 } : {}}
              whileTap={!isSubmitting ? { scale: 0.95 } : {}}
            >
              {isSubmitting ? (
                <>
                  <motion.svg 
                    className="-ml-1 mr-2 h-4 w-4 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </motion.svg>
                  Guardando...
                </>
              ) : (
                'Crear Rol'
              )}
            </motion.button>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
}