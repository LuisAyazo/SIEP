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

export default function CreateUserPage() {
  const params = useParams();
  const centerSlug = params.centerSlug as string;
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  const router = useRouter();
  
  // Cargar roles y centros desde Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        
        // Cargar roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('*')
          .order('name');
        
        if (rolesError) throw rolesError;
        
        setRoles(rolesData || []);
        
        // Seleccionar 'funcionario' por defecto
        const defaultRole = rolesData?.find(r => r.name === 'funcionario') || rolesData?.[0];
        if (defaultRole) {
          setFormData(prev => ({ ...prev, role: defaultRole.id }));
          setSelectedRole(defaultRole);
        }
        
        // Cargar centros
        const { data: centersData, error: centersError } = await supabase
          .from('centers')
          .select('id, name, slug')
          .order('name');
        
        if (centersError) throw centersError;
        
        setCenters(centersData || []);
        
        // Seleccionar centro de servicios por defecto
        const defaultCenter = centersData?.find(c => c.slug === 'centro-servicios');
        if (defaultCenter) {
          setSelectedCenters([defaultCenter.id]);
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setIsLoadingRoles(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Update selected role info when role changes
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
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El formato del correo electrónico es inválido';
    } else if (!formData.email.endsWith('@unicartagena.edu.co')) {
      newErrors.email = 'El correo debe ser del dominio @unicartagena.edu.co';
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'El nombre completo es requerido';
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
      
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name
          }
        }
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');
      
      const newUserId = authData.user.id;
      
      // Asignar rol al usuario
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: newUserId,
          role_id: formData.role
        });
      
      if (roleError) throw roleError;
      
      // Asignar centros al usuario
      if (selectedCenters.length > 0) {
        const centerAssignments = selectedCenters.map(centerId => ({
          user_id: newUserId,
          center_id: centerId
        }));
        
        const { error: centersError } = await supabase
          .from('user_centers')
          .insert(centerAssignments);
        
        if (centersError) throw centersError;
      }
      
      // Redireccionar a la lista de usuarios tras éxito
      router.push(`/center/${centerSlug}/dashboard/users`);
    } catch (error: any) {
      console.error('Error creating user:', error);
      setErrors({
        form: error.message || 'Ocurrió un error al crear el usuario. Por favor intente nuevamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const inputVariants = {
    focus: { scale: 1.02, borderColor: '#f59e0b', transition: { duration: 0.2 } },
    error: { x: [0, -10, 10, -10, 0], transition: { duration: 0.4 } }
  };

  return (
    <PermissionGuard
      resource={RESOURCES.USERS}
      requiredPermission={PermissionLevel.WRITE}
      redirectTo="/dashboard"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="bg-white rounded-lg shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-white">
            <div className="flex items-center space-x-3">
              <motion.div 
                className="p-2 bg-amber-100 rounded-full"
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Crear Nuevo Usuario</h1>
                <p className="text-gray-600 text-sm mt-1">Complete todos los campos para crear un nuevo usuario en el sistema.</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            {errors.form && (
              <motion.div 
                className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md"
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
                    <p className="text-sm text-red-700">{errors.form}</p>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
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
                    className={`shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full px-4 sm:text-sm border-gray-300 rounded-md h-12 text-gray-900 bg-white ${errors.full_name ? 'border-red-300' : ''}`}
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Ingrese el nombre completo"
                  />
                </motion.div>
                {errors.full_name && (
                  <motion.p 
                    className="mt-1 text-sm text-red-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {errors.full_name}
                  </motion.p>
                )}
              </div>
              
              <div className="col-span-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <motion.div 
                  whileFocus="focus" 
                  animate={errors.email ? "error" : ""}
                  variants={inputVariants}
                >
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className={`shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full px-4 sm:text-sm border-gray-300 rounded-md h-12 text-gray-900 bg-white ${errors.email ? 'border-red-300' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ejemplo@unicartagena.edu.co"
                  />
                </motion.div>
                {errors.email && (
                  <motion.p 
                    className="mt-1 text-sm text-red-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {errors.email}
                  </motion.p>
                )}
              </div>
              
              <div className="col-span-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <motion.div 
                    whileFocus="focus" 
                    animate={errors.password ? "error" : ""}
                    variants={inputVariants}
                  >
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      className={`shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full px-4 pr-10 sm:text-sm border-gray-300 rounded-md h-12 text-gray-900 bg-white ${errors.password ? 'border-red-300' : ''}`}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </motion.div>
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.95 }}>
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </motion.div>
                  </button>
                </div>
                {errors.password && (
                  <motion.p 
                    className="mt-1 text-sm text-red-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {errors.password}
                  </motion.p>
                )}
              </div>
              
              <div className="col-span-1">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <motion.div 
                  whileFocus="focus" 
                  animate={errors.confirmPassword ? "error" : ""}
                  variants={inputVariants}
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    id="confirmPassword"
                    className={`shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full px-4 sm:text-sm border-gray-300 rounded-md h-12 text-gray-900 bg-white ${errors.confirmPassword ? 'border-red-300' : ''}`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repita la contraseña"
                  />
                </motion.div>
                {errors.confirmPassword && (
                  <motion.p 
                    className="mt-1 text-sm text-red-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {errors.confirmPassword}
                  </motion.p>
                )}
              </div>
              
              <div className="col-span-2">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Rol de Usuario
                </label>
                {isLoadingRoles ? (
                  <div className="h-12 bg-gray-100 animate-pulse rounded-md"></div>
                ) : (
                  <select
                    id="role"
                    name="role"
                    className="block w-full px-4 pr-10 py-3 h-12 text-base border border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md shadow-sm"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={roles.length === 0}
                  >
                    <option value="">Seleccione un rol</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                )}
                
                {selectedRole && (
                  <motion.div
                    className="mt-3 p-4 bg-gradient-to-r from-amber-50 to-white rounded-md border border-amber-200"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800 capitalize">{selectedRole.name.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-600 mt-1">{selectedRole.description}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Centros Asignados
                </label>
                <div className="bg-gray-50 rounded-md border border-gray-200 p-4">
                  <div className="space-y-3">
                    {centers.map(center => (
                      <label key={center.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedCenters.includes(center.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCenters([...selectedCenters, center.id]);
                            } else {
                              setSelectedCenters(selectedCenters.filter(id => id !== center.id));
                            }
                          }}
                          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">{center.name}</span>
                      </label>
                    ))}
                  </div>
                  {selectedCenters.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2">⚠️ Debes seleccionar al menos un centro</p>
                  )}
                </div>
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
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
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
                    Creando...
                  </>
                ) : (
                  'Crear Usuario'
                )}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </PermissionGuard>
  );
}