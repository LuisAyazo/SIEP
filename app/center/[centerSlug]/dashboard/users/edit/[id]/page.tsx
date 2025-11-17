'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import PermissionGuard from '@/components/PermissionGuard';
import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';
import { createClient } from '@/lib/supabase/client';

interface Role {
  id: string;
  name: string;
  display_name: string;
}

interface Center {
  id: string;
  name: string;
  slug: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const centerSlug = params.centerSlug as string;
  const supabase = createClient();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: ''
  });
  const [assignedCenters, setAssignedCenters] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Cargar roles
        const { data: rolesData } = await supabase
          .from('roles')
          .select('id, name, display_name')
          .order('name');
        
        setRoles(rolesData || []);

        // Cargar centros
        const { data: centersData } = await supabase
          .from('centers')
          .select('id, name, slug')
          .order('name');
        
        setCenters(centersData || []);

        // Cargar datos del usuario
        const { data: userData } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            user_roles (role_id),
            user_centers (center_id)
          `)
          .eq('id', userId)
          .single();

        if (userData) {
          const userRole = userData.user_roles?.[0]?.role_id || '';
          const userCenters = userData.user_centers?.map((uc: any) => uc.center_id) || [];

          console.log('✅ Centros asignados al usuario:', userCenters);
          console.log('✅ Centros disponibles:', centersData);

          setFormData({
            full_name: userData.full_name || '',
            email: userData.email || '',
            role: userRole,
            password: '',
            confirmPassword: ''
          });
          setAssignedCenters(userCenters);
        }
      } catch (err: any) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos del usuario');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId, supabase]);

  const handleCenterToggle = (centerId: string) => {
    setAssignedCenters(prev => 
      prev.includes(centerId)
        ? prev.filter(id => id !== centerId)
        : [...prev, centerId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Validaciones
    if (!formData.full_name.trim()) {
      setError('El nombre completo es obligatorio');
      return;
    }

    if (!formData.role) {
      setError('Debes seleccionar un rol');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      // Actualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: formData.full_name })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Actualizar rol
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role_id: formData.role });

      if (roleError) throw roleError;

      // Actualizar centros asignados
      await supabase
        .from('user_centers')
        .delete()
        .eq('user_id', userId);

      if (assignedCenters.length > 0) {
        const centerAssignments = assignedCenters.map(centerId => ({
          user_id: userId,
          center_id: centerId
        }));

        const { error: centersError } = await supabase
          .from('user_centers')
          .insert(centerAssignments);

        if (centersError) throw centersError;
      }

      // Actualizar contraseña si se proporcionó
      if (formData.password) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: formData.password }
        );

        if (passwordError) throw passwordError;
      }

      setSuccessMessage('Usuario actualizado correctamente');
      setTimeout(() => {
        router.push(`/center/${centerSlug}/dashboard/users`);
      }, 1500);
    } catch (err: any) {
      console.error('Error al actualizar usuario:', err);
      setError('Error al actualizar el usuario: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PermissionGuard
      resource={RESOURCES.USERS}
      requiredPermission={PermissionLevel.WRITE}
      redirectTo="/dashboard"
    >
      <motion.div 
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Editar Usuario</h1>
          <p className="text-gray-600 mt-1">Actualiza la información del usuario</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
            <p>{successMessage}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full px-4 h-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 h-12 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">El correo no puede ser modificado</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-4 h-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              >
                <option value="">Selecciona un rol</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.display_name || role.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Centros Asignados</h3>
              <div className="space-y-2">
                {centers.map(center => (
                  <label key={center.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignedCenters.includes(center.id)}
                      onChange={() => handleCenterToggle(center.id)}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{center.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cambiar Contraseña (Opcional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 h-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Dejar en blanco para no cambiar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full px-4 h-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Confirma la nueva contraseña"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-md text-white transition-colors ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </PermissionGuard>
  );
}