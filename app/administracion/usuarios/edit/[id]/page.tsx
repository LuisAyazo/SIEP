'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { usePermission } from '@/app/auth/hooks';
import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';
import PermissionGuard from '@/components/PermissionGuard';
import { createClient } from '@/lib/supabase/client';

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Center {
  id: string;
  name: string;
  slug: string;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role_id: string;
  center_ids: string[];
}

export default function EditUserPage() {
  const params = useParams();
  const userId = params.id as string;
  
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  const router = useRouter();
  
  // Cargar datos del usuario, roles y centros
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        
        // Cargar datos del usuario
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            user_roles (
              role_id,
              roles (
                id,
                name,
                description
              )
            ),
            user_centers (
              center_id
            )
          `)
          .eq('id', userId)
          .single();
        
        if (userError) throw userError;
        
        // Cargar todos los roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('*')
          .order('name');
        
        if (rolesError) throw rolesError;
        
        setRoles(rolesData || []);
        
        // Cargar todos los centros
        const { data: centersData, error: centersError } = await supabase
          .from('centers')
          .select('id, name, slug')
          .order('name');
        
        if (centersError) throw centersError;
        
        setCenters(centersData || []);
        
        // Establecer datos del formulario
        if (userData) {
          const userRoleData = userData.user_roles?.[0]?.roles;
          const userRole = Array.isArray(userRoleData) ? userRoleData[0] : userRoleData;
          const userCenterIds = userData.user_centers?.map((uc: any) => uc.center_id) || [];
          
          setFormData({
            email: userData.email || '',
            full_name: userData.full_name || '',
            role: userRole?.id || ''
          });
          
          setSelectedCenters(userCenterIds);
          
          if (userRole) {
            setSelectedRole(userRole);
          }
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
        setErrors({ form: 'Error al cargar los datos del usuario' });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId) {
      fetchData();
    }
  }, [userId]);
  
  // Actualizar rol seleccionado cuando cambia
  useEffect(() => {
    const roleInfo = roles.find(r => r.id === formData.role);
    setSelectedRole(roleInfo || null);
  }, [formData.role, roles]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario escribe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'El nombre completo es requerido';
    }
    
    if (!formData.role) {
      newErrors.role = 'Debe seleccionar un rol';
    }
    
    if (selectedCenters.length === 0) {
      newErrors.centers = 'Debe seleccionar al menos un centro';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      
      // Actualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name
        })
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      // Actualizar rol
      // Primero eliminar roles existentes
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      // Insertar nuevo rol
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: formData.role
        });
      
      if (roleError) throw roleError;
      
      // Actualizar centros
      // Primero eliminar centros existentes
      await supabase
        .from('user_centers')
        .delete()
        .eq('user_id', userId);
      
      // Insertar nuevos centros
      if (selectedCenters.length > 0) {
        const centerAssignments = selectedCenters.map(centerId => ({
          user_id: userId,
          center_id: centerId
        }));
        
        const { error: centersError } = await supabase
          .from('user_centers')
          .insert(centerAssignments);
        
        if (centersError) throw centersError;
      }
      
      // Redireccionar a la lista de usuarios tras éxito
      router.push('/administracion/usuarios');
    } catch (error: any) {
      console.error('Error actualizando usuario:', error);
      setErrors({
        form: error.message || 'Ocurrió un error al actualizar el usuario. Por favor intente nuevamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const inputVariants = {
    focus: { scale: 1.02, borderColor: '#f59e0b', transition: { duration: 0.2 } },
    error: { x: [0, -10, 10, -10, 0], transition: { duration: 0.4 } }
  };

  if (isLoading) {
    return (
      <PermissionGuard
        resource={RESOURCES.USERS}
        requiredPermission={PermissionLevel.WRITE}
        redirectTo="/dashboard"
      >
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard
      resource={RESOURCES.USERS}
      requiredPermission={PermissionLevel.WRITE}
      redirectTo="/dashboard"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-amber-50 to-white dark:from-gray-700 dark:to-gray-800">
            <div className="flex items-center space-x-3">
              <motion.div 
                className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full"
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Editar Usuario</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Modifique los datos del usuario en el sistema.</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            {errors.form && (
              <motion.div 
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 rounded-md"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-400">{errors.form}</p>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre Completo
                </label>
                <motion.div 
                  whileFocus="focus" 
                  animate={errors.full_name ? "error" : ""}
                  variants={inputVariants}
                >
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    className={`shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full px-4 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md h-12 text-gray-900 dark:text-white bg-white dark:bg-gray-700 ${errors.full_name ? 'border-red-300 dark:border-red-600' : ''}`}
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Ingrese el nombre completo"
                  />
                </motion.div>
                {errors.full_name && (
                  <motion.p 
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {errors.full_name}
                  </motion.p>
                )}
              </div>
              
              <div className="col-span-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    disabled
                    className="shadow-sm block w-full px-4 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md h-12 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                    value={formData.email}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">El correo electrónico no se puede modificar</p>
              </div>
              
              <div className="col-span-2">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rol de Usuario
                </label>
                <select
                  id="role"
                  name="role"
                  className={`block w-full px-4 pr-10 py-3 h-12 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.role ? 'border-red-300 dark:border-red-600' : ''}`}
                  value={formData.role}
                  onChange={handleChange}
                  disabled={roles.length === 0}
                >
                  <option value="">Seleccione un rol</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                {errors.role && (
                  <motion.p 
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {errors.role}
                  </motion.p>
                )}
                
                {selectedRole && (
                  <motion.div
                    className="mt-3 p-4 bg-gradient-to-r from-amber-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-md border border-amber-200 dark:border-amber-800"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white capitalize">{selectedRole.name.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{selectedRole.description}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Centros Asignados
                </label>
                <div className={`bg-gray-50 dark:bg-gray-700 rounded-md border ${errors.centers ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-600'} p-4`}>
                  <div className="space-y-3">
                    {centers.map(center => (
                      <label key={center.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedCenters.includes(center.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCenters([...selectedCenters, center.id]);
                            } else {
                              setSelectedCenters(selectedCenters.filter(id => id !== center.id));
                            }
                            // Limpiar error de centros
                            if (errors.centers) {
                              setErrors(prev => ({ ...prev, centers: '' }));
                            }
                          }}
                          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{center.name}</span>
                      </label>
                    ))}
                  </div>
                  {selectedCenters.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">⚠️ Debes seleccionar al menos un centro</p>
                  )}
                </div>
                {errors.centers && (
                  <motion.p 
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {errors.centers}
                  </motion.p>
                )}
              </div>
            </div>
            
            <motion.div 
              className="flex justify-end mt-8 space-x-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                type="button"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                onClick={() => router.back()}
                disabled={isSubmitting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancelar
              </motion.button>
              <motion.button
                type="submit"
                className={`inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
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
                  'Guardar Cambios'
                )}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </PermissionGuard>
  );
}
