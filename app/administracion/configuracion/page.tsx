'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PermissionGuard from '@/components/PermissionGuard';
import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';
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

export default function SettingsPage() {
  const supabase = createClient();
  const { availableCenters } = useCenterContext();
  const [activeTab, setActiveTab] = useState('general');
  
  // Estados para asignación de centros
  const [users, setUsers] = useState<User[]>([]);
  const [userCenterAssignments, setUserCenterAssignments] = useState<Record<string, string[]>>({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSavingCenters, setIsSavingCenters] = useState(false);
  const [showCentersSuccess, setShowCentersSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newFicha: true,
    updates: false,
    approvals: true,
    systemUpdates: true
  });
  const [displaySettings, setDisplaySettings] = useState({
    darkMode: false,
    compactView: false,
    showWelcome: true,
    language: 'es'
  });
  
  // Cargar usuarios cuando se selecciona la pestaña de centros
  useEffect(() => {
    if (activeTab === 'centers') {
      loadUsers();
    }
  }, [activeTab]);
  
  const loadUsers = async () => {
    setIsLoadingUsers(true);
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
      setIsLoadingUsers(false);
    }
  };
  
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
  
  const handleSaveCenterAssignments = async () => {
    setIsSavingCenters(true);
    
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
      
      setShowCentersSuccess(true);
      setTimeout(() => setShowCentersSuccess(false), 3000);
    } catch (error) {
      console.error('❌ Error al guardar asignaciones:', error);
    } finally {
      setIsSavingCenters(false);
    }
  };
  
  // Debug: Log display settings changes
  useEffect(() => {
    console.log('🎨 displaySettings changed:', displaySettings);
  }, [displaySettings]);
  const [systemSettings, setSystemSettings] = useState({
    autoSave: true,
    autoSaveInterval: 5,
    sessionTimeout: 30,
    defaultView: 'dashboard'
  });
  
  // Add prefix settings state
  const [prefixSettings, setPrefixSettings] = useState({
    fichasPrefix: 'FC-',
    presupuestoPrefix: 'PS-',
    proyectosPrefix: 'PY-',
    documentosPrefix: 'DOC-',
    informesPrefix: 'INF-'
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Animación para los elementos
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  // Handle prefix settings changes
  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPrefixSettings({
      ...prefixSettings,
      [name]: value
    });
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    // Simular una solicitud de guardado
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }, 1500);
  };

  return (
    <PermissionGuard 
      resource={RESOURCES.SETTINGS} 
      requiredPermission={PermissionLevel.READ}
      redirectTo="/dashboard"
    >
      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Configuración</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Personaliza la plataforma según tus preferencias
            </p>
          </div>
          <motion.button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className={`mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSaving ? 'bg-gray-400' : 'bg-amber-600 hover:bg-amber-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500`}
            whileHover={!isSaving ? { scale: 1.03 } : {}}
            whileTap={!isSaving ? { scale: 0.97 } : {}}
          >
            {isSaving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </motion.button>
        </motion.div>
        
        {/* Mensaje de éxito */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: showSuccessMessage ? 1 : 0,
            height: showSuccessMessage ? 'auto' : 0
          }}
          className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4"
        >
          <div className="flex">
            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="ml-3">Cambios guardados correctamente.</p>
          </div>
        </motion.div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          {/* Pestañas */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('general')}
                className={`${
                  activeTab === 'general'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`${
                  activeTab === 'notifications'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Notificaciones
              </button>
              <button
                onClick={() => setActiveTab('display')}
                className={`${
                  activeTab === 'display'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Apariencia
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`${
                  activeTab === 'system'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Sistema
              </button>
              <button
                onClick={() => setActiveTab('prefixes')}
                className={`${
                  activeTab === 'prefixes'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Prefijos
              </button>
              <button
                onClick={() => setActiveTab('centers')}
                className={`${
                  activeTab === 'centers'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Centros
              </button>
            </nav>
          </div>

          {/* Contenido de las pestañas */}
          <div className="p-6">
            {activeTab === 'general' && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="general"
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Información del Perfil</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Actualiza tu información personal y de contacto.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md px-4 h-12 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                      defaultValue="Admin Usuario"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md px-4 h-12 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                      defaultValue="admin@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Rol actual
                    </label>
                    <input
                      type="text"
                      name="role"
                      id="role"
                      className="mt-1 bg-gray-50 dark:bg-gray-700 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md px-4 h-12 text-gray-900 dark:text-gray-400"
                      defaultValue="Administrador"
                      disabled
                    />
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Departamento
                    </label>
                      <select
                        id="department"
                        name="department"
                        className="mt-1 block w-full h-12 px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                      >
                      <option>Tecnología</option>
                      <option>Finanzas</option>
                      <option>Operaciones</option>
                      <option>Recursos Humanos</option>
                      <option>Marketing</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Cambiar contraseña</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Actualiza tu contraseña regularmente para mantener tu cuenta segura.
                  </p>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Contraseña actual
                      </label>
                      <input
                        type="password"
                        name="current-password"
                        id="current-password"
                        className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md px-4 h-12 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nueva contraseña
                        </label>
                        <input
                          type="password"
                          name="new-password"
                          id="new-password"
                          className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md px-4 h-12 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                        />
                      </div>

                      <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Confirmar contraseña
                        </label>
                        <input
                          type="password"
                          name="confirm-password"
                          id="confirm-password"
                          className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md px-4 h-12 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="notifications"
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preferencias de Notificaciones</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Decide qué notificaciones quieres recibir y cómo.
                  </p>
                </div>

                <div className="mt-6">
                  <div className="flex items-start mb-4">
                    <div className="flex items-center h-5">
                      <input
                        id="email-notifications"
                        name="email-notifications"
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                        className="focus:ring-amber-500 h-4 w-4 text-amber-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="email-notifications" className="font-medium text-gray-700 dark:text-gray-300">
                        Notificaciones por correo electrónico
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">Recibir notificaciones importantes vía email.</p>
                    </div>
                  </div>

                  <div className="ml-8 space-y-4 border-l border-gray-200 dark:border-gray-700 pl-6">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="new-ficha"
                          name="new-ficha"
                          type="checkbox"
                          disabled={!notificationSettings.emailNotifications}
                          checked={notificationSettings.newFicha}
                          onChange={(e) => setNotificationSettings({...notificationSettings, newFicha: e.target.checked})}
                          className="focus:ring-amber-500 h-4 w-4 text-amber-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="new-ficha" className="font-medium text-gray-700 dark:text-gray-300">
                          Nuevas fichas
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">Cuando se crea una nueva ficha en el sistema.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="updates"
                          name="updates"
                          type="checkbox"
                          disabled={!notificationSettings.emailNotifications}
                          checked={notificationSettings.updates}
                          onChange={(e) => setNotificationSettings({...notificationSettings, updates: e.target.checked})}
                          className="focus:ring-amber-500 h-4 w-4 text-amber-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="updates" className="font-medium text-gray-700 dark:text-gray-300">
                          Actualizaciones de fichas
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">Cuando se modifican fichas existentes.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="approvals"
                          name="approvals"
                          type="checkbox"
                          disabled={!notificationSettings.emailNotifications}
                          checked={notificationSettings.approvals}
                          onChange={(e) => setNotificationSettings({...notificationSettings, approvals: e.target.checked})}
                          className="focus:ring-amber-500 h-4 w-4 text-amber-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="approvals" className="font-medium text-gray-700 dark:text-gray-300">
                          Aprobaciones
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">Cuando se requiere tu aprobación o cuando se aprueba algo que solicitaste.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="system-updates"
                          name="system-updates"
                          type="checkbox"
                          disabled={!notificationSettings.emailNotifications}
                          checked={notificationSettings.systemUpdates}
                          onChange={(e) => setNotificationSettings({...notificationSettings, systemUpdates: e.target.checked})}
                          className="focus:ring-amber-500 h-4 w-4 text-amber-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="system-updates" className="font-medium text-gray-700 dark:text-gray-300">
                          Actualizaciones del sistema
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">Notificaciones sobre cambios en la plataforma.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'display' && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="display"
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preferencias de Interfaz</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Personaliza la apariencia y funcionalidad de la interfaz de usuario.
                  </p>
                </div>

                <div className="mt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Modo oscuro</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Activar tema oscuro para reducir el cansancio visual.</p>
                    </div>
                    <button
                      onClick={() => {
                        console.log('🖱️ Dark mode toggle clicked!');
                        console.log('   Current darkMode:', displaySettings.darkMode);
                        const newSettings = {...displaySettings, darkMode: !displaySettings.darkMode};
                        console.log('   New darkMode:', newSettings.darkMode);
                        setDisplaySettings(newSettings);
                      }}
                      type="button"
                      className={`${
                        displaySettings.darkMode ? 'bg-amber-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500`}
                      role="switch"
                      aria-checked={displaySettings.darkMode}
                    >
                      <span
                        className={`${
                          displaySettings.darkMode ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      ></span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Vista compacta</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Mostrar más información en menos espacio.</p>
                    </div>
                    <button
                      onClick={() => {
                        console.log('🖱️ Compact view toggle clicked!');
                        console.log('   Current compactView:', displaySettings.compactView);
                        const newSettings = {...displaySettings, compactView: !displaySettings.compactView};
                        console.log('   New compactView:', newSettings.compactView);
                        setDisplaySettings(newSettings);
                      }}
                      type="button"
                      className={`${
                        displaySettings.compactView ? 'bg-amber-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500`}
                      role="switch"
                      aria-checked={displaySettings.compactView}
                    >
                      <span
                        className={`${
                          displaySettings.compactView ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      ></span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Mensaje de bienvenida</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Mostrar saludo personalizado en el dashboard.</p>
                    </div>
                    <button
                      onClick={() => {
                        console.log('🖱️ Show welcome toggle clicked!');
                        console.log('   Current showWelcome:', displaySettings.showWelcome);
                        const newSettings = {...displaySettings, showWelcome: !displaySettings.showWelcome};
                        console.log('   New showWelcome:', newSettings.showWelcome);
                        setDisplaySettings(newSettings);
                      }}
                      type="button"
                      className={`${
                        displaySettings.showWelcome ? 'bg-amber-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500`}
                      role="switch"
                      aria-checked={displaySettings.showWelcome}
                    >
                      <span
                        className={`${
                          displaySettings.showWelcome ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      ></span>
                    </button>
                  </div>
                  
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Idioma
                    </label>
                      <select
                        id="language"
                        name="language"
                        value={displaySettings.language}
                        onChange={(e) => setDisplaySettings({...displaySettings, language: e.target.value})}
                        className="mt-1 block w-full h-12 px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                      >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="pt">Português</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'system' && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="system"
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configuración del Sistema</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Ajusta la configuración técnica del sistema.
                  </p>
                </div>

                <div className="mt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Autoguardado</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Guardar automáticamente los cambios en formularios.</p>
                    </div>
                    <button
                      onClick={() => setSystemSettings({...systemSettings, autoSave: !systemSettings.autoSave})}
                      type="button"
                      className={`${
                        systemSettings.autoSave ? 'bg-amber-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500`}
                      role="switch"
                      aria-checked={systemSettings.autoSave}
                    >
                      <span
                        className={`${
                          systemSettings.autoSave ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      ></span>
                    </button>
                  </div>
                  
                  {systemSettings.autoSave && (
                    <div className="ml-8 border-l border-gray-200 dark:border-gray-700 pl-6">
                      <label htmlFor="auto-save-interval" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Intervalo de autoguardado (minutos)
                      </label>
                      <select
                        id="auto-save-interval"
                        name="auto-save-interval"
                        value={systemSettings.autoSaveInterval}
                        onChange={(e) => setSystemSettings({...systemSettings, autoSaveInterval: Number(e.target.value)})}
                        className="mt-1 block w-full h-12 px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                      >
                        <option value="1">1 minuto</option>
                        <option value="5">5 minutos</option>
                        <option value="10">10 minutos</option>
                        <option value="15">15 minutos</option>
                        <option value="30">30 minutos</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label htmlFor="session-timeout" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tiempo de inactividad para cierre de sesión (minutos)
                    </label>
                    <select
                      id="session-timeout"
                      name="session-timeout"
                      value={systemSettings.sessionTimeout}
                      onChange={(e) => setSystemSettings({...systemSettings, sessionTimeout: Number(e.target.value)})}
                      className="mt-1 block w-full h-12 px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                    >
                      <option value="15">15 minutos</option>
                      <option value="30">30 minutos</option>
                      <option value="60">1 hora</option>
                      <option value="120">2 horas</option>
                      <option value="0">Nunca</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="default-view" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Vista predeterminada al iniciar sesión
                    </label>
                    <select
                      id="default-view"
                      name="default-view"
                      value={systemSettings.defaultView}
                      onChange={(e) => setSystemSettings({...systemSettings, defaultView: e.target.value})}
                      className="mt-1 block w-full h-12 px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                    >
                      <option value="dashboard">Dashboard</option>
                      <option value="forms">Fichas</option>
                      <option value="history">Historial</option>
                      <option value="approvals">Aprobaciones</option>
                      <option value="documents">Documentos</option>
                    </select>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-red-800 dark:text-red-400">Zona de peligro</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Estas acciones son irreversibles y pueden afectar gravemente a tu cuenta.
                  </p>
                  
                  <div className="mt-4 flex space-x-4">
                    <motion.button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-700 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Eliminar datos de sesión
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-700 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Restablecer a valores predeterminados
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'prefixes' && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="prefixes"
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configuración de Prefijos</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Define los prefijos usados para identificar diferentes tipos de documentos en el sistema.
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fichasPrefix" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Prefijo Fichas
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="fichasPrefix"
                        id="fichasPrefix"
                        value={prefixSettings.fichasPrefix}
                        onChange={handlePrefixChange}
                        className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md px-4 h-12 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                        placeholder="FC-"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ejemplo: FC-2025-001</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="presupuestoPrefix" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Prefijo Presupuestos
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="presupuestoPrefix"
                        id="presupuestoPrefix"
                        value={prefixSettings.presupuestoPrefix}
                        onChange={handlePrefixChange}
                        className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md px-4 h-12 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                        placeholder="PS-"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ejemplo: PS-2025-001</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="proyectosPrefix" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Prefijo Proyectos
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="proyectosPrefix"
                        id="proyectosPrefix"
                        value={prefixSettings.proyectosPrefix}
                        onChange={handlePrefixChange}
                        className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md px-4 h-12 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                        placeholder="PY-"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ejemplo: PY-2025-001</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="documentosPrefix" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Prefijo Documentos
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="documentosPrefix"
                        id="documentosPrefix"
                        value={prefixSettings.documentosPrefix}
                        onChange={handlePrefixChange}
                        className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md px-4 h-12 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                        placeholder="DOC-"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ejemplo: DOC-2025-001</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="informesPrefix" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Prefijo Informes
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="informesPrefix"
                        id="informesPrefix"
                        value={prefixSettings.informesPrefix}
                        onChange={handlePrefixChange}
                        className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md px-4 h-12 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                        placeholder="INF-"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ejemplo: INF-2025-001</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600 mt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Información sobre prefijos</h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Los prefijos ayudan a identificar rápidamente el tipo de documento en el sistema.
                    La estructura típica es: {"{PREFIJO}"}-{"{AÑO}"}-{"{SECUENCIAL}"}.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'centers' && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="centers"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Asignación de Centros a Usuarios</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gestiona qué usuarios tienen acceso a cada centro.</p>
                  </div>
                </div>

                {/* Buscador de usuarios */}
                <div className="mb-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar por nombre o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {showCentersSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4">
                    <div className="flex">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a 1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="ml-3">Asignaciones guardadas correctamente.</p>
                    </div>
                  </div>
                )}

                {isLoadingUsers ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usuario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                            {availableCenters.map(center => (
                              <th key={center.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {center.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {users
                            .filter(user =>
                              user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              user.email.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map(user => (
                            <tr key={user.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
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
                          {users.filter(user =>
                            user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase())
                          ).length === 0 && (
                            <tr>
                              <td colSpan={2 + availableCenters.length} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                No se encontraron usuarios que coincidan con "{searchTerm}"
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveCenterAssignments}
                        disabled={isSavingCenters}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${isSavingCenters ? 'bg-gray-400' : 'bg-amber-600 hover:bg-amber-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500`}
                      >
                        {isSavingCenters && (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {isSavingCenters ? 'Guardando...' : 'Guardar Asignaciones'}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </PermissionGuard>
  );
}
