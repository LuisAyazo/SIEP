'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePermission } from '@/app/auth/hooks';
import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';
import PermissionGuard from '@/components/PermissionGuard';
import { createClient } from '@/lib/supabase/client';

// Definición de los 6 roles del sistema SIEP
const rolesMock = [
  {
    id: '1',
    name: 'administrador',
    displayName: 'Administrador',
    description: 'Acceso completo a todas las funcionalidades del sistema. Puede gestionar usuarios, roles, solicitudes y configuraciones.',
    color: 'amber',
    icon: '👑',
    permissions: [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'roles.create', 'roles.read', 'roles.update', 'roles.delete',
      'solicitudes.create', 'solicitudes.read', 'solicitudes.update', 'solicitudes.delete',
      'solicitudes.approve', 'solicitudes.reject', 'solicitudes.assign',
      'meetings.create', 'meetings.read', 'meetings.update', 'meetings.delete',
      'centers.manage', 'reports.all', 'system.configure'
    ],
    userCount: 1,
    isSystem: true,
    created_at: '2025-04-01T10:00:00Z'
  },
  {
    id: '2',
    name: 'director_centro',
    displayName: 'Director de Centro',
    description: 'Director con permisos administrativos del centro. Aprueba/rechaza solicitudes y gestiona el equipo del centro.',
    color: 'purple',
    icon: '🎯',
    permissions: [
      'users.read', 'users.update',
      'solicitudes.read', 'solicitudes.approve', 'solicitudes.reject',
      'solicitudes.assign', 'solicitudes.send_to_group',
      'meetings.create', 'meetings.read', 'meetings.update',
      'reports.center', 'budget.read'
    ],
    userCount: 1,
    isSystem: true,
    created_at: '2025-04-01T10:00:00Z'
  },
  {
    id: '3',
    name: 'funcionario',
    displayName: 'Funcionario',
    description: 'Usuario estándar que crea y gestiona solicitudes de fichas técnicas, programas y convenios.',
    color: 'indigo',
    icon: '📝',
    permissions: [
      'solicitudes.create', 'solicitudes.read', 'solicitudes.update',
      'solicitudes.comment', 'solicitudes.upload_files',
      'meetings.read', 'reports.own'
    ],
    userCount: 3,
    isSystem: true,
    created_at: '2025-04-01T10:00:00Z'
  },
  {
    id: '4',
    name: 'operacion',
    displayName: 'Operación',
    description: 'Acceso a operaciones básicas del sistema sin permisos administrativos.',
    color: 'green',
    icon: '⚙️',
    permissions: [
      'solicitudes.read', 'solicitudes.comment',
      'meetings.read', 'reports.basic'
    ],
    userCount: 1,
    isSystem: true,
    created_at: '2025-04-01T10:00:00Z'
  },
  {
    id: '5',
    name: 'consulta',
    displayName: 'Consulta',
    description: 'Acceso de solo lectura. Puede visualizar información sin realizar modificaciones.',
    color: 'blue',
    icon: '👁️',
    permissions: [
      'solicitudes.read', 'meetings.read', 'reports.view'
    ],
    userCount: 1,
    isSystem: true,
    created_at: '2025-04-01T10:00:00Z'
  },
  {
    id: '6',
    name: 'coordinador_centro',
    displayName: 'Coordinador de Centro',
    description: 'Coordinador con permisos específicos para gestionar actividades y procesos del centro.',
    color: 'teal',
    icon: '🤝',
    permissions: [
      'solicitudes.read', 'solicitudes.comment',
      'meetings.create', 'meetings.read', 'meetings.update',
      'reports.center'
    ],
    userCount: 1,
    isSystem: true,
    created_at: '2025-04-01T10:00:00Z'
  }
];

// Descripciones detalladas de permisos
const permissionDescriptions: {[key: string]: string} = {
  // Usuarios
  'users.create': 'Crear nuevos usuarios',
  'users.read': 'Ver usuarios del sistema',
  'users.update': 'Editar información de usuarios',
  'users.delete': 'Eliminar usuarios',
  
  // Roles
  'roles.create': 'Crear nuevos roles',
  'roles.read': 'Ver roles del sistema',
  'roles.update': 'Modificar roles existentes',
  'roles.delete': 'Eliminar roles',
  
  // Solicitudes
  'solicitudes.create': 'Crear nuevas solicitudes',
  'solicitudes.read': 'Ver solicitudes',
  'solicitudes.update': 'Editar solicitudes',
  'solicitudes.delete': 'Eliminar solicitudes',
  'solicitudes.approve': 'Aprobar solicitudes',
  'solicitudes.reject': 'Rechazar solicitudes',
  'solicitudes.assign': 'Asignar solicitudes',
  'solicitudes.comment': 'Comentar en solicitudes',
  'solicitudes.upload_files': 'Subir archivos Excel',
  'solicitudes.send_to_group': 'Enviar al grupo revisor',
  
  // Meetings (Comités)
  'meetings.create': 'Crear comités',
  'meetings.read': 'Ver comités',
  'meetings.update': 'Modificar comités',
  'meetings.delete': 'Cancelar comités',
  
  // Centros
  'centers.manage': 'Gestionar centros',
  
  // Reportes
  'reports.own': 'Ver propios reportes',
  'reports.basic': 'Ver reportes básicos',
  'reports.center': 'Ver reportes del centro',
  'reports.all': 'Ver todos los reportes',
  'reports.view': 'Visualizar reportes',
  
  // Budget
  'budget.read': 'Ver presupuestos',
  
  // Sistema
  'system.configure': 'Configurar sistema'
};

// Agrupación de permisos
const permissionGroups = {
  'Usuarios': ['users.create', 'users.read', 'users.update', 'users.delete'],
  'Roles': ['roles.create', 'roles.read', 'roles.update', 'roles.delete'],
  'Solicitudes': [
    'solicitudes.create', 'solicitudes.read', 'solicitudes.update', 'solicitudes.delete',
    'solicitudes.approve', 'solicitudes.reject', 'solicitudes.assign', 
    'solicitudes.comment', 'solicitudes.upload_files', 'solicitudes.send_to_group'
  ],
  'Comités': ['meetings.create', 'meetings.read', 'meetings.update', 'meetings.delete'],
  'Reportes': ['reports.own', 'reports.basic', 'reports.center', 'reports.all', 'reports.view'],
  'Sistema': ['centers.manage', 'budget.read', 'system.configure']
};

export default function RolesPage() {
  const params = useParams();
  const centerSlug = params.centerSlug as string;
  const [roles, setRoles] = useState(rolesMock);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // Cargar roles desde Supabase
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (rolesError) throw rolesError;

      // Transformar datos de Supabase al formato esperado
      const transformedRoles = rolesData?.map(role => ({
        id: role.id,
        name: role.name,
        displayName: role.display_name || role.name,
        description: role.description || '',
        color: getColorForRole(role.name),
        icon: getIconForRole(role.name),
        permissions: role.permissions || [],
        userCount: 0, // Se podría calcular con una consulta adicional
        isSystem: true,
        created_at: role.created_at
      })) || [];

      setRoles(transformedRoles);
      setError('');
    } catch (err: any) {
      console.error('[RolesPage] Error al cargar roles:', err);
      setError('Error al cargar los roles');
    } finally {
      setIsLoading(false);
    }
  };

  // Función auxiliar para obtener colores por rol
  const getColorForRole = (roleName: string): string => {
    const colorMap: Record<string, string> = {
      'administrador': 'amber',
      'director_centro': 'purple',
      'funcionario': 'indigo',
      'operacion': 'green',
      'consulta': 'blue',
      'coordinador_centro': 'teal'
    };
    return colorMap[roleName] || 'gray';
  };

  // Función auxiliar para obtener íconos por rol
  const getIconForRole = (roleName: string): string => {
    const iconMap: Record<string, string> = {
      'administrador': '👑',
      'director_centro': '🎯',
      'funcionario': '📝',
      'operacion': '⚙️',
      'consulta': '👁️',
      'coordinador_centro': '🤝'
    };
    return iconMap[roleName] || '📋';
  };

  const handleDeleteRole = async (roleId: string) => {
    const roleToDelete = roles.find(role => role.id === roleId);
    
    if (roleToDelete?.isSystem) {
      alert('Este rol es esencial para el sistema y no puede ser eliminado.');
      return;
    }
    
    if (window.confirm('¿Estás seguro de que deseas eliminar este rol?')) {
      setIsLoading(true);
      try {
        setRoles(roles.filter(role => role.id !== roleId));
        setError('');
      } catch (err) {
        setError('Error al eliminar el rol');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const getColorClasses = (color: string) => ({
    bg: `bg-${color}-100`,
    text: `text-${color}-800`,
    border: `border-${color}-500`,
    hover: `hover:bg-${color}-50`
  });

  return (
    <PermissionGuard
      resource={RESOURCES.ROLES}
      requiredPermission={PermissionLevel.READ}
      redirectTo="/dashboard"
    >
      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div className="bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Roles</h1>
              <p className="text-gray-600 mt-2">Administra los 6 roles del sistema SIEP y sus permisos</p>
            </div>
            <div className="flex gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <Link
                href={`/center/${centerSlug}/dashboard/roles/create`}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Crear Rol
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4" variants={itemVariants}>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Roles</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{roles.length}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Roles del Sistema</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{roles.filter(r => r.isSystem).length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {roles.reduce((acc, role) => acc + role.userCount, 0)}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div 
            className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700"
            variants={itemVariants}
          >
            {error}
          </motion.div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={itemVariants}
          >
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className={`h-2 bg-${role.color}-500`}></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{role.icon}</span>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{role.displayName}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full bg-${role.color}-100 text-${role.color}-800`}>
                          {role.name}
                        </span>
                      </div>
                    </div>
                    {role.isSystem && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        Sistema
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{role.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      {role.userCount} usuarios
                    </span>
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      {role.permissions.length} permisos
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedRole(selectedRole === role.id ? null : role.id)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        selectedRole === role.id
                          ? `bg-${role.color}-100 text-${role.color}-800`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {selectedRole === role.id ? 'Ocultar' : 'Ver'} Permisos
                    </button>
                    <Link
                      href={`/center/${centerSlug}/dashboard/roles/edit/${role.name}`}
                      className="px-3 py-2 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      disabled={role.isSystem}
                      className={`px-3 py-2 rounded-md transition-colors ${
                        role.isSystem
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                      title={role.isSystem ? 'Rol del sistema no eliminable' : 'Eliminar rol'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {selectedRole === role.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Permisos:</h4>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((perm, i) => (
                            <span
                              key={i}
                              className={`text-xs px-2 py-1 rounded bg-${role.color}-50 text-${role.color}-700`}
                              title={permissionDescriptions[perm]}
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <motion.div className="bg-white rounded-lg shadow-sm overflow-hidden" variants={itemVariants}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuarios</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permisos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role, index) => (
                  <motion.tr
                    key={role.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{role.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{role.displayName}</div>
                          <div className="text-xs text-gray-500">{role.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-md">{role.description}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{role.userCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full bg-${role.color}-100 text-${role.color}-800`}>
                        {role.permissions.length} permisos
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/center/${centerSlug}/dashboard/roles/edit/${role.name}`}
                          className="text-amber-600 hover:text-amber-900"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          disabled={role.isSystem}
                          className={role.isSystem ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Permissions Reference */}
        <motion.div className="bg-white rounded-lg shadow-sm p-6" variants={itemVariants}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Referencia de Permisos</h3>
            <button
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              className="text-amber-600 hover:text-amber-700 font-medium text-sm"
            >
              {showInfoPanel ? 'Ocultar' : 'Mostrar'} detalles
            </button>
          </div>

          <AnimatePresence>
            {showInfoPanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {Object.entries(permissionGroups).map(([group, perms]) => (
                  <div key={group} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">{group}</h4>
                    <ul className="space-y-2">
                      {perms.map(perm => (
                        <li key={perm} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-amber-500 mt-1">•</span>
                          <div>
                            <div className="font-medium text-gray-700">{permissionDescriptions[perm]}</div>
                            <div className="text-xs text-gray-500">{perm}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </PermissionGuard>
  );
}