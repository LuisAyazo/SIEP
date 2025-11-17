'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PermissionGuard from '@/components/PermissionGuard';
import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';
import { useCenterContext } from '@/components/providers/CenterContext';
import { useSupabaseSession } from '@/components/providers/SessionProvider';
import { createClient } from '@/lib/supabase/client';

interface UserSettings {
  dark_mode: boolean;
  compact_view: boolean;
  show_welcome: boolean;
  language: string;
  auto_save: boolean;
  auto_save_interval: number;
  session_timeout: number;
  default_view: string;
  email_notifications: boolean;
  new_ficha_notifications: boolean;
  update_notifications: boolean;
  approval_notifications: boolean;
  system_update_notifications: boolean;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  assigned_centers: string[];
}

export default function SettingsPage() {
  const { user } = useSupabaseSession();
  const supabase = createClient();
  const { availableCenters } = useCenterContext();
  
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  // Estados para datos del perfil
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    role: ''
  });
  
  // Estados para configuraciones del usuario
  const [userSettings, setUserSettings] = useState<UserSettings>({
    dark_mode: false,
    compact_view: false,
    show_welcome: true,
    language: 'es',
    auto_save: true,
    auto_save_interval: 5,
    session_timeout: 30,
    default_view: 'dashboard',
    email_notifications: true,
    new_ficha_notifications: true,
    update_notifications: false,
    approval_notifications: true,
    system_update_notifications: true
  });
  
  // Estados para prefijos
  const [prefixSettings, setPrefixSettings] = useState({
    fichasPrefix: 'FC-',
    presupuestoPrefix: 'PS-',
    proyectosPrefix: 'PY-',
    documentosPrefix: 'DOC-',
    informesPrefix: 'INF-'
  });
  
  // Estados para centros
  const [users, setUsers] = useState<User[]>([]);
  const [userCenterAssignments, setUserCenterAssignments] = useState<Record<string, string[]>>({});
  const [savingAssignments, setSavingAssignments] = useState(false);
  
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
  
  // Cargar datos del perfil
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      
      setIsLoadingProfile(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();

        const { data: userRoles } = await supabase
          .from('user_roles')
          .select(`roles!inner (name, display_name)`)
          .eq('user_id', user.id);

        const roleNames = userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];
        const specificRole = roleNames.find((r: string) => r !== 'funcionario');
        const primaryRole = specificRole || roleNames[0] || 'funcionario';
        
        const primaryRoleData = userRoles?.find((ur: any) => ur.roles?.name === primaryRole);
        const role = primaryRoleData?.roles as any;
        const roleDisplayName = role?.display_name || primaryRole;

        setProfileData({
          full_name: profile?.full_name || '',
          email: profile?.email || user.email || '',
          role: roleDisplayName
        });
      } catch (error) {
        console.error('Error al cargar perfil:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user, supabase]);
  
  // Cargar configuraciones del usuario
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user?.id) return;
      
      setIsLoadingSettings(true);
      try {
        const { data: settings } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (settings) {
          setUserSettings({
            dark_mode: settings.dark_mode,
            compact_view: settings.compact_view,
            show_welcome: settings.show_welcome,
            language: settings.language,
            auto_save: settings.auto_save,
            auto_save_interval: settings.auto_save_interval,
            session_timeout: settings.session_timeout,
            default_view: settings.default_view,
            email_notifications: settings.email_notifications,
            new_ficha_notifications: settings.new_ficha_notifications,
            update_notifications: settings.update_notifications,
            approval_notifications: settings.approval_notifications,
            system_update_notifications: settings.system_update_notifications
          });
        }
      } catch (error) {
        console.error('Error al cargar configuraciones:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadUserSettings();
  }, [user, supabase]);
  
  // Cargar usuarios y sus centros asignados
  useEffect(() => {
    const loadUsers = async () => {
      if (activeTab !== 'centers') return;
      
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
          console.log(`✅ Usuario ${user.email}: centros asignados =`, user.assigned_centers);
        });
        setUserCenterAssignments(assignments);
        
        console.log('✅ Total usuarios cargados:', formattedUsers.length);
        console.log('✅ Asignaciones completas:', assignments);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsers();
  }, [activeTab, supabase]);

  // Guardar configuraciones
  const handleSaveSettings = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      console.log('💾 Guardando configuraciones:', userSettings);
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...userSettings
        });

      if (error) throw error;
      
      console.log('✅ Configuraciones guardadas correctamente');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('❌ Error al guardar configuraciones:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Manejar cambio en asignaciones de centros
  const handleCenterAssignmentChange = (userId: string, centerId: string, isChecked: boolean) => {
    console.log(`🔄 Cambiando asignación: usuario=${userId}, centro=${centerId}, checked=${isChecked}`);
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
      
      console.log(`✅ Nuevas asignaciones para usuario:`, newAssignments[userId]);
      return newAssignments;
    });
  };
  
  // Guardar asignaciones de centros
  const handleSaveCenterAssignments = async () => {
    setSavingAssignments(true);
    
    try {
      for (const [userId, centerIds] of Object.entries(userCenterAssignments)) {
        // Eliminar asignaciones existentes
        await supabase
          .from('user_centers')
          .delete()
          .eq('user_id', userId);
        
        // Insertar nuevas asignaciones
        if (centerIds.length > 0) {
          const assignments = centerIds.map(centerId => ({
            user_id: userId,
            center_id: centerId
          }));
          
          await supabase
            .from('user_centers')
            .insert(assignments);
        }
      }
      
      setSavingAssignments(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error al guardar asignaciones:', error);
      setSavingAssignments(false);
    }
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
            <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
            <p className="text-gray-600 mt-1">
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
            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a 1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="ml-3">Cambios guardados correctamente.</p>
          </div>
        </motion.div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* Pestañas */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {['general', 'notifications', 'display', 'system', 'prefixes', 'centers'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                >
                  {tab === 'general' && 'General'}
                  {tab === 'notifications' && 'Notificaciones'}
                  {tab === 'display' && 'Apariencia'}
                  {tab === 'system' && 'Sistema'}
                  {tab === 'prefixes' && 'Prefijos'}
                  {tab === 'centers' && 'Centros'}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenido de las pestañas */}
          <div className="p-6">
            {activeTab === 'general' && (
              <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="general">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Información del Perfil</h3>
                  <p className="mt-1 text-sm text-gray-500">Actualiza tu información personal.</p>
                </div>

                {isLoadingProfile ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
                        <input
                          type="text"
                          value={profileData.full_name}
                          onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                          className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-4 h-12"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
                        <input
                          type="email"
                          value={profileData.email}
                          disabled
                          className="mt-1 bg-gray-50 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-4 h-12"
                        />
                        <p className="mt-1 text-xs text-gray-500">El correo no puede ser modificado</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Rol actual</label>
                        <input
                          type="text"
                          value={profileData.role}
                          disabled
                          className="mt-1 bg-gray-50 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-4 h-12"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-6 mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Cambiar Contraseña</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Nueva contraseña</label>
                          <input
                            type="password"
                            className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-4 h-12"
                            placeholder="Mínimo 6 caracteres"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
                          <input
                            type="password"
                            className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-4 h-12"
                            placeholder="Repite la contraseña"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <button
                          type="button"
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                        >
                          Actualizar Contraseña
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="notifications">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Preferencias de Notificaciones</h3>
                  <p className="mt-1 text-sm text-gray-500">Decide qué notificaciones quieres recibir.</p>
                </div>

                {isLoadingSettings ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={userSettings.email_notifications}
                          onChange={(e) => setUserSettings({...userSettings, email_notifications: e.target.checked})}
                          className="focus:ring-amber-500 h-4 w-4 text-amber-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label className="font-medium text-gray-700">Notificaciones por correo</label>
                        <p className="text-gray-500">Recibir notificaciones importantes vía email.</p>
                      </div>
                    </div>

                    <div className="ml-8 space-y-4 border-l border-gray-200 pl-6">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            disabled={!userSettings.email_notifications}
                            checked={userSettings.new_ficha_notifications}
                            onChange={(e) => setUserSettings({...userSettings, new_ficha_notifications: e.target.checked})}
                            className="focus:ring-amber-500 h-4 w-4 text-amber-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label className="font-medium text-gray-700">Nuevas fichas</label>
                          <p className="text-gray-500">Cuando se crea una nueva ficha.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            disabled={!userSettings.email_notifications}
                            checked={userSettings.update_notifications}
                            onChange={(e) => setUserSettings({...userSettings, update_notifications: e.target.checked})}
                            className="focus:ring-amber-500 h-4 w-4 text-amber-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label className="font-medium text-gray-700">Actualizaciones</label>
                          <p className="text-gray-500">Cuando se modifican fichas existentes.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            disabled={!userSettings.email_notifications}
                            checked={userSettings.approval_notifications}
                            onChange={(e) => setUserSettings({...userSettings, approval_notifications: e.target.checked})}
                            className="focus:ring-amber-500 h-4 w-4 text-amber-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label className="font-medium text-gray-700">Aprobaciones</label>
                          <p className="text-gray-500">Cuando se requiere aprobación.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            disabled={!userSettings.email_notifications}
                            checked={userSettings.system_update_notifications}
                            onChange={(e) => setUserSettings({...userSettings, system_update_notifications: e.target.checked})}
                            className="focus:ring-amber-500 h-4 w-4 text-amber-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label className="font-medium text-gray-700">Actualizaciones del sistema</label>
                          <p className="text-gray-500">Notificaciones sobre cambios.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'display' && (
              <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="display">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Preferencias de Interfaz</h3>
                  <p className="mt-1 text-sm text-gray-500">Personaliza la apariencia de la interfaz.</p>
                </div>

                {isLoadingSettings ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Modo oscuro</h4>
                        <p className="text-sm text-gray-500">Activar tema oscuro.</p>
                      </div>
                      <button
                        onClick={() => setUserSettings({...userSettings, dark_mode: !userSettings.dark_mode})}
                        type="button"
                        className={`${
                          userSettings.dark_mode ? 'bg-amber-600' : 'bg-gray-200'
                        } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500`}
                      >
                        <span
                          className={`${
                            userSettings.dark_mode ? 'translate-x-5' : 'translate-x-0'
                          } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                        ></span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Vista compacta</h4>
                        <p className="text-sm text-gray-500">Mostrar más información en menos espacio.</p>
                      </div>
                      <button
                        onClick={() => setUserSettings({...userSettings, compact_view: !userSettings.compact_view})}
                        type="button"
                        className={`${
                          userSettings.compact_view ? 'bg-amber-600' : 'bg-gray-200'
                        } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500`}
                      >
                        <span
                          className={`${
                            userSettings.compact_view ? 'translate-x-5' : 'translate-x-0'
                          } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                        ></span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Mensaje de bienvenida</h4>
                        <p className="text-sm text-gray-500">Mostrar saludo en el dashboard.</p>
                      </div>
                      <button
                        onClick={() => setUserSettings({...userSettings, show_welcome: !userSettings.show_welcome})}
                        type="button"
                        className={`${
                          userSettings.show_welcome ? 'bg-amber-600' : 'bg-gray-200'
                        } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500`}
                      >
                        <span
                          className={`${
                            userSettings.show_welcome ? 'translate-x-5' : 'translate-x-0'
                          } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                        ></span>
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Idioma</label>
                      <select
                        value={userSettings.language}
                        onChange={(e) => setUserSettings({...userSettings, language: e.target.value})}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'system' && (
              <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="system">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Configuración del Sistema</h3>
                  <p className="mt-1 text-sm text-gray-500">Ajusta la configuración técnica.</p>
                </div>

                {isLoadingSettings ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Autoguardado</h4>
                        <p className="text-sm text-gray-500">Guardar automáticamente los cambios.</p>
                      </div>
                      <button
                        onClick={() => setUserSettings({...userSettings, auto_save: !userSettings.auto_save})}
                        type="button"
                        className={`${
                          userSettings.auto_save ? 'bg-amber-600' : 'bg-gray-200'
                        } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500`}
                      >
                        <span
                          className={`${
                            userSettings.auto_save ? 'translate-x-5' : 'translate-x-0'
                          } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                        ></span>
                      </button>
                    </div>
                    
                    {userSettings.auto_save && (
                      <div className="ml-8 border-l border-gray-200 pl-6">
                        <label className="block text-sm font-medium text-gray-700">Intervalo de autoguardado (minutos)</label>
                        <select
                          value={userSettings.auto_save_interval}
                          onChange={(e) => setUserSettings({...userSettings, auto_save_interval: Number(e.target.value)})}
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
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
                      <label className="block text-sm font-medium text-gray-700">Tiempo de inactividad para cierre de sesión (minutos)</label>
                      <select
                        value={userSettings.session_timeout}
                        onChange={(e) => setUserSettings({...userSettings, session_timeout: Number(e.target.value)})}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                      >
                        <option value="15">15 minutos</option>
                        <option value="30">30 minutos</option>
                        <option value="60">1 hora</option>
                        <option value="120">2 horas</option>
                        <option value="0">Nunca</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vista predeterminada al iniciar sesión</label>
                      <select
                        value={userSettings.default_view}
                        onChange={(e) => setUserSettings({...userSettings, default_view: e.target.value})}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                      >
                        <option value="dashboard">Dashboard</option>
                        <option value="forms">Fichas</option>
                        <option value="history">Historial</option>
                        <option value="documents">Documentos</option>
                      </select>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'prefixes' && (
              <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="prefixes">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Prefijos de Identificadores</h3>
                  <p className="mt-1 text-sm text-gray-500">Configura los prefijos para los identificadores de cada tipo de documento.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prefijo de Fichas</label>
                    <input
                      type="text"
                      value={prefixSettings.fichasPrefix}
                      onChange={(e) => setPrefixSettings({...prefixSettings, fichasPrefix: e.target.value})}
                      className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-4 h-12"
                      placeholder="FC-"
                    />
                    <p className="mt-1 text-xs text-gray-500">Ejemplo: FC-001, FC-002</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prefijo de Presupuesto</label>
                    <input
                      type="text"
                      value={prefixSettings.presupuestoPrefix}
                      onChange={(e) => setPrefixSettings({...prefixSettings, presupuestoPrefix: e.target.value})}
                      className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-4 h-12"
                      placeholder="PS-"
                    />
                    <p className="mt-1 text-xs text-gray-500">Ejemplo: PS-001, PS-002</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prefijo de Proyectos</label>
                    <input
                      type="text"
                      value={prefixSettings.proyectosPrefix}
                      onChange={(e) => setPrefixSettings({...prefixSettings, proyectosPrefix: e.target.value})}
                      className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-4 h-12"
                      placeholder="PY-"
                    />
                    <p className="mt-1 text-xs text-gray-500">Ejemplo: PY-001, PY-002</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prefijo de Documentos</label>
                    <input
                      type="text"
                      value={prefixSettings.documentosPrefix}
                      onChange={(e) => setPrefixSettings({...prefixSettings, documentosPrefix: e.target.value})}
                      className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-4 h-12"
                      placeholder="DOC-"
                    />
                    <p className="mt-1 text-xs text-gray-500">Ejemplo: DOC-001, DOC-002</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prefijo de Informes</label>
                    <input
                      type="text"
                      value={prefixSettings.informesPrefix}
                      onChange={(e) => setPrefixSettings({...prefixSettings, informesPrefix: e.target.value})}
                      className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-4 h-12"
                      placeholder="INF-"
                    />
                    <p className="mt-1 text-xs text-gray-500">Ejemplo: INF-001, INF-002</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Los prefijos se aplicarán automáticamente a todos los nuevos documentos creados en el centro.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'centers' && (
              <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="centers">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Asignación de Centros a Usuarios</h3>
                  <p className="mt-1 text-sm text-gray-500">Gestiona qué usuarios tienen acceso a cada centro.</p>
                </div>

                {isLoadingUsers ? (
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
                              <th key={center.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title={center.id}>
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
                                console.log(`🔍 Checkbox: usuario=${user.email}, centro=${center.name}, checked=${isChecked}, centerIds=`, userCenterAssignments[user.id]);
                                return (
                                  <td key={`${user.id}-${center.id}`} className="px-6 py-4 whitespace-nowrap text-center">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded cursor-pointer"
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
                        onClick={handleSaveCenterAssignments}
                        disabled={savingAssignments}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                          ${savingAssignments ? 'bg-gray-400' : 'bg-amber-600 hover:bg-amber-700'} 
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500`}
                      >
                        {savingAssignments && (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {savingAssignments ? 'Guardando...' : 'Guardar Asignaciones'}
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
