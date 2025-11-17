'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import PermissionGuard from '@/components/PermissionGuard';
import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
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
            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="ml-3">Cambios guardados correctamente.</p>
          </div>
        </motion.div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* Pestañas */}
          <div className="border-b border-gray-200">
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
                  <h3 className="text-lg font-medium text-gray-900">Información del Perfil</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Actualiza tu información personal y de contacto.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      defaultValue="Admin Usuario"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      defaultValue="admin@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Rol actual
                    </label>
                    <input
                      type="text"
                      name="role"
                      id="role"
                      className="mt-1 bg-gray-50 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      defaultValue="Administrador"
                      disabled
                    />
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                      Departamento
                    </label>
                    <select
                      id="department"
                      name="department"
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                    >
                      <option>Tecnología</option>
                      <option>Finanzas</option>
                      <option>Operaciones</option>
                      <option>Recursos Humanos</option>
                      <option>Marketing</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900">Cambiar contraseña</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Actualiza tu contraseña regularmente para mantener tu cuenta segura.
                  </p>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                        Contraseña actual
                      </label>
                      <input
                        type="password"
                        name="current-password"
                        id="current-password"
                        className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                          Nueva contraseña
                        </label>
                        <input
                          type="password"
                          name="new-password"
                          id="new-password"
                          className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                          Confirmar contraseña
                        </label>
                        <input
                          type="password"
                          name="confirm-password"
                          id="confirm-password"
                          className="mt-1 focus:ring-amber-500 focus:border-amber-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
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
                  <h3 className="text-lg font-medium text-gray-900">Preferencias de Notificaciones</h3>
                  <p className="mt-1 text-sm text-gray-500">
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
                      <label htmlFor="email-notifications" className="font-medium text-gray-700">
                        Notificaciones por correo electrónico
                      </label>
                      <p className="text-gray-500">Recibir notificaciones importantes vía email.</p>
                    </div>
                  </div>

                  <div className="ml-8 space-y-4 border-l border-gray-200 pl-6">
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
                        <label htmlFor="new-ficha" className="font-medium text-gray-700">
                          Nuevas fichas
                        </label>
                        <p className="text-gray-500">Cuando se crea una nueva ficha en el sistema.</p>
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
                        <label htmlFor="updates" className="font-medium text-gray-700">
                          Actualizaciones de fichas
                        </label>
                        <p className="text-gray-500">Cuando se modifican fichas existentes.</p>
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
                        <label htmlFor="approvals" className="font-medium text-gray-700">
                          Aprobaciones
                        </label>
                        <p className="text-gray-500">Cuando se requiere tu aprobación o cuando se aprueba algo que solicitaste.</p>
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
                        <label htmlFor="system-updates" className="font-medium text-gray-700">
                          Actualizaciones del sistema
                        </label>
                        <p className="text-gray-500">Notificaciones sobre cambios en la plataforma.</p>
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
                  <h3 className="text-lg font-medium text-gray-900">Preferencias de Interfaz</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Personaliza la apariencia y funcionalidad de la interfaz de usuario.
                  </p>
                </div>

                <div className="mt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Modo oscuro</h4>
                      <p className="text-sm text-gray-500">Activar tema oscuro para reducir el cansancio visual.</p>
                    </div>
                    <button
                      onClick={() => setDisplaySettings({...displaySettings, darkMode: !displaySettings.darkMode})}
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
                      <h4 className="text-sm font-medium text-gray-900">Vista compacta</h4>
                      <p className="text-sm text-gray-500">Mostrar más información en menos espacio.</p>
                    </div>
                    <button
                      onClick={() => setDisplaySettings({...displaySettings, compactView: !displaySettings.compactView})}
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
                      <h4 className="text-sm font-medium text-gray-900">Mensaje de bienvenida</h4>
                      <p className="text-sm text-gray-500">Mostrar saludo personalizado en el dashboard.</p>
                    </div>
                    <button
                      onClick={() => setDisplaySettings({...displaySettings, showWelcome: !displaySettings.showWelcome})}
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
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                      Idioma
                    </label>
                    <select
                      id="language"
                      name="language"
                      value={displaySettings.language}
                      onChange={(e) => setDisplaySettings({...displaySettings, language: e.target.value})}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
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
                  <h3 className="text-lg font-medium text-gray-900">Configuración del Sistema</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Ajusta la configuración técnica del sistema.
                  </p>
                </div>

                <div className="mt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Autoguardado</h4>
                      <p className="text-sm text-gray-500">Guardar automáticamente los cambios en formularios.</p>
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
                    <div className="ml-8 border-l border-gray-200 pl-6">
                      <label htmlFor="auto-save-interval" className="block text-sm font-medium text-gray-700">
                        Intervalo de autoguardado (minutos)
                      </label>
                      <select
                        id="auto-save-interval"
                        name="auto-save-interval"
                        value={systemSettings.autoSaveInterval}
                        onChange={(e) => setSystemSettings({...systemSettings, autoSaveInterval: Number(e.target.value)})}
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
                    <label htmlFor="session-timeout" className="block text-sm font-medium text-gray-700">
                      Tiempo de inactividad para cierre de sesión (minutos)
                    </label>
                    <select
                      id="session-timeout"
                      name="session-timeout"
                      value={systemSettings.sessionTimeout}
                      onChange={(e) => setSystemSettings({...systemSettings, sessionTimeout: Number(e.target.value)})}
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
                    <label htmlFor="default-view" className="block text-sm font-medium text-gray-700">
                      Vista predeterminada al iniciar sesión
                    </label>
                    <select
                      id="default-view"
                      name="default-view"
                      value={systemSettings.defaultView}
                      onChange={(e) => setSystemSettings({...systemSettings, defaultView: e.target.value})}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                    >
                      <option value="dashboard">Dashboard</option>
                      <option value="forms">Fichas</option>
                      <option value="history">Historial</option>
                      <option value="approvals">Aprobaciones</option>
                      <option value="documents">Documentos</option>
                    </select>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-red-800">Zona de peligro</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Estas acciones son irreversibles y pueden afectar gravemente a tu cuenta.
                  </p>
                  
                  <div className="mt-4 flex space-x-4">
                    <motion.button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Eliminar datos de sesión
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
                  <h3 className="text-lg font-medium text-gray-900">Configuración de Prefijos</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Define los prefijos usados para identificar diferentes tipos de documentos en el sistema.
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fichasPrefix" className="block text-sm font-medium text-gray-700">
                      Prefijo Fichas
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="fichasPrefix"
                        id="fichasPrefix"
                        value={prefixSettings.fichasPrefix}
                        onChange={handlePrefixChange}
                        className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="FC-"
                      />
                      <p className="mt-1 text-xs text-gray-500">Ejemplo: FC-2025-001</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="presupuestoPrefix" className="block text-sm font-medium text-gray-700">
                      Prefijo Presupuestos
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="presupuestoPrefix"
                        id="presupuestoPrefix"
                        value={prefixSettings.presupuestoPrefix}
                        onChange={handlePrefixChange}
                        className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="PS-"
                      />
                      <p className="mt-1 text-xs text-gray-500">Ejemplo: PS-2025-001</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="proyectosPrefix" className="block text-sm font-medium text-gray-700">
                      Prefijo Proyectos
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="proyectosPrefix"
                        id="proyectosPrefix"
                        value={prefixSettings.proyectosPrefix}
                        onChange={handlePrefixChange}
                        className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="PY-"
                      />
                      <p className="mt-1 text-xs text-gray-500">Ejemplo: PY-2025-001</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="documentosPrefix" className="block text-sm font-medium text-gray-700">
                      Prefijo Documentos
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="documentosPrefix"
                        id="documentosPrefix"
                        value={prefixSettings.documentosPrefix}
                        onChange={handlePrefixChange}
                        className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="DOC-"
                      />
                      <p className="mt-1 text-xs text-gray-500">Ejemplo: DOC-2025-001</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="informesPrefix" className="block text-sm font-medium text-gray-700">
                      Prefijo Informes
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="informesPrefix"
                        id="informesPrefix"
                        value={prefixSettings.informesPrefix}
                        onChange={handlePrefixChange}
                        className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="INF-"
                      />
                      <p className="mt-1 text-xs text-gray-500">Ejemplo: INF-2025-001</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Información sobre prefijos</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Los prefijos ayudan a identificar rápidamente el tipo de documento en el sistema. 
                    La estructura típica es: {"{PREFIJO}"}-{"{AÑO}"}-{"{SECUENCIAL}"}.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </PermissionGuard>
  );
}
