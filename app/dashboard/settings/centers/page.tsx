'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCenterContext } from '@/components/providers/CenterContext';
import { useSupabaseSession } from '@/components/providers/SessionProvider';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  assigned_centers: string[];
}

export default function CentersAssignmentPage() {
  const { user } = useSupabaseSession();
  const supabase = createClient();
  const { availableCenters } = useCenterContext();
  
  const [users, setUsers] = useState<User[]>([]);
  const [userCenterAssignments, setUserCenterAssignments] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const { data: usersData } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            created_at,
            user_roles (roles!inner (name, display_name)),
            user_centers (center_id)
          `);

        const formattedUsers: User[] = usersData?.map((userData: any) => {
          const roles = userData.user_roles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];
          const specificRole = roles.find((r: string) => r !== 'funcionario');
          const primaryRole = specificRole || roles[0] || 'funcionario';
          
          const primaryRoleData = userData.user_roles?.find((ur: any) => ur.roles?.name === primaryRole);
          const role = primaryRoleData?.roles as any;
          const roleDisplayName = role?.display_name || primaryRole;

          const assigned_centers = userData.user_centers?.map((uc: any) => uc.center_id) || [];

          return {
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            role: roleDisplayName,
            created_at: userData.created_at,
            assigned_centers
          };
        }) || [];

        setUsers(formattedUsers);
        
        const assignments: Record<string, string[]> = {};
        formattedUsers.forEach(user => {
          assignments[user.id] = [...user.assigned_centers];
        });
        setUserCenterAssignments(assignments);
        
        console.log('✅ Usuarios cargados:', formattedUsers.length);
        console.log('✅ Asignaciones iniciales:', assignments);
      } catch (error) {
        console.error('❌ Error al cargar usuarios:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [supabase]);
  
  const handleCenterAssignmentChange = (userId: string, centerId: string, isChecked: boolean) => {
    setUserCenterAssignments(prev => {
      const current = [...(prev[userId] || [])];
      let newAssignments;
      
      if (isChecked) {
        if (!current.includes(centerId)) {
          newAssignments = { ...prev, [userId]: [...current, centerId] };
        } else {
          return prev;
        }
      } else {
        newAssignments = { ...prev, [userId]: current.filter(id => id !== centerId) };
      }
      
      console.log(`✅ Usuario ${userId}: nuevos centros =`, newAssignments[userId]);
      return newAssignments;
    });
  };
  
  const handleSaveAssignments = async () => {
    setIsSaving(true);
    
    try {
      for (const [userId, centerIds] of Object.entries(userCenterAssignments)) {
        await supabase.from('user_centers').delete().eq('user_id', userId);
        
        if (centerIds.length > 0) {
          const assignments = centerIds.map(centerId => ({
            user_id: userId,
            center_id: centerId
          }));
          
          await supabase.from('user_centers').insert(assignments);
        }
      }
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('❌ Error al guardar asignaciones:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Asignación de Centros a Usuarios</h3>
          <p className="mt-1 text-sm text-gray-500">Gestiona qué usuarios tienen acceso a cada centro.</p>
        </div>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a 1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="ml-3">Asignaciones guardadas correctamente.</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                  {availableCenters.map(center => (
                    <th key={center.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {center.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </td>
                    {availableCenters.map(center => {
                      const isChecked = userCenterAssignments[user.id]?.includes(center.id) || false;
                      return (
                        <td key={`${user.id}-${center.id}`} className="px-6 py-4 whitespace-nowrap text-center">
                          <input 
                            type="checkbox" 
                            className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                            checked={isChecked}
                            onChange={(e) => handleCenterAssignmentChange(user.id, center.id, e.target.checked)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSaveAssignments}
              disabled={isSaving}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${isSaving ? 'bg-gray-400' : 'bg-amber-600 hover:bg-amber-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500`}
            >
              {isSaving && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSaving ? 'Guardando...' : 'Guardar Asignaciones'}
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}