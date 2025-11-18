'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabaseSession } from '@/components/providers/SessionProvider';
import { usePermission } from '@/app/auth/hooks';
import { PermissionLevel, RESOURCES } from '@/app/auth/permissions';
import { motion, AnimatePresence } from 'framer-motion';
import { useCenterContext } from '@/components/providers/CenterContext';

// Component imports
import StatCard from '@/components/dashboard/StatCard';
import DashboardChart from '@/components/dashboard/DashboardChart';

// Icons
import { Calendar, FileText, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Datos ficticios para el dashboard
const MOCK_DATA = {
  stats: [
    { 
      title: 'Fichas Creadas', 
      value: 128, 
      change: 12, 
      changeType: 'increase' as const, 
      period: 'vs mes anterior',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      title: 'Usuarios Activos', 
      value: 24, 
      change: 4, 
      changeType: 'increase' as const, 
      period: 'vs mes anterior',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      title: 'Documentos Subidos', 
      value: 56, 
      change: -3, 
      changeType: 'decrease' as const, 
      period: 'vs mes anterior',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      )
    },
    { 
      title: 'Procesos Pendientes', 
      value: 14, 
      change: -5, 
      changeType: 'decrease' as const, 
      period: 'vs mes anterior',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      title: 'Aprobaciones Financieras', 
      value: 32, 
      change: 8, 
      changeType: 'increase' as const, 
      period: 'vs mes anterior',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      title: 'Presupuesto Utilizado', 
      value: '75%', 
      change: 5, 
      changeType: 'increase' as const, 
      period: 'vs mes anterior',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ],
  
  chartData: {
    formsCreatedByMonth: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
      datasets: [
        {
          label: 'Fichas Creadas',
          data: [12, 15, 10, 14, 18, 16, 19, 22, 25, 28],
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    userActivityByDay: {
      labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
      datasets: [
        {
          label: 'Usuarios Activos',
          data: [42, 38, 45, 50, 38, 15, 12],
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }
      ]
    }
  }
};

interface Meeting {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  location?: string;
  meeting_link?: string;
}

interface Solicitud {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  due_date?: string;
}

// Vista principal del dashboard
export default function DashboardPage({ params }: { params: Promise<{ centerSlug: string }> }) {
  const resolvedParams = use(params);
  const { user, session, loading: authLoading } = useSupabaseSession();
  const { currentCenter } = useCenterContext();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [pendingSolicitudes, setPendingSolicitudes] = useState<Solicitud[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);

  // Cargar reuniones próximas
  useEffect(() => {
    if (!currentCenter) return;
    
    const loadUpcomingMeetings = async () => {
      try {
        setLoadingMeetings(true);
        const response = await fetch(`/api/meetings?center_id=${currentCenter.id}&status=scheduled&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setUpcomingMeetings(data.meetings || []);
        }
      } catch (error) {
        console.error('Error al cargar comités:', error);
      } finally {
        setLoadingMeetings(false);
      }
    };

    loadUpcomingMeetings();
  }, [currentCenter]);

  // Cargar solicitudes pendientes
  useEffect(() => {
    if (!currentCenter) return;
    
    const loadPendingSolicitudes = async () => {
      try {
        setLoadingSolicitudes(true);
        const response = await fetch(`/api/solicitudes?center_id=${currentCenter.id}&status=pendiente&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setPendingSolicitudes(data.solicitudes || []);
        }
      } catch (error) {
        console.error('Error al cargar solicitudes:', error);
      } finally {
        setLoadingSolicitudes(false);
      }
    };

    loadPendingSolicitudes();
  }, [currentCenter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'en_revision': 'bg-blue-100 text-blue-800',
      'aprobada': 'bg-green-100 text-green-800',
      'rechazada': 'bg-red-100 text-red-800',
      'scheduled': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'baja': 'text-green-600',
      'normal': 'text-blue-600',
      'alta': 'text-orange-600',
      'urgente': 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-b-2 border-amber-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div 
        className="flex flex-col md:flex-row justify-between items-start md:items-center"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {getGreeting()}, {user?.email?.split('@')[0] || user?.user_metadata?.full_name || 'Usuario'}
          </h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <select 
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-700 focus:outline-none focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="quarter">Este Trimestre</option>
            <option value="year">Este Año</option>
          </select>
        </div>
      </motion.div>

      {/* Tarjetas de estadísticas */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5"
        variants={itemVariants}
      >
        {MOCK_DATA.stats.map((stat, index) => (
          <motion.div 
            key={index}
            whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
            transition={{ duration: 0.2 }}
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              change={stat.change}
              changeType={stat.changeType}
              period={stat.period}
              icon={stat.icon}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Widgets de Reuniones y Solicitudes */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        variants={itemVariants}
      >
        {/* Reuniones Próximas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-amber-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Comités Próximos</h3>
            </div>
            <Link href={`/center/${resolvedParams.centerSlug}/dashboard/meetings`}>
              <button className="text-amber-600 hover:text-amber-700 text-sm font-medium">
                Ver todas →
              </button>
            </Link>
          </div>

          {loadingMeetings ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 border-b-2 border-amber-600 rounded-full animate-spin" />
            </div>
          ) : upcomingMeetings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No hay comités programados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.slice(0, 3).map((meeting) => (
                <Link 
                  key={meeting.id}
                  href={`/center/${resolvedParams.centerSlug}/dashboard/meetings/${meeting.id}`}
                >
                  <motion.div
                    className="p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 line-clamp-1">{meeting.title}</h4>
                        <div className="flex items-center mt-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{new Date(meeting.scheduled_at).toLocaleDateString('es-ES', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                          <span className="mx-2">•</span>
                          <span>{meeting.duration_minutes} min</span>
                        </div>
                        {meeting.meeting_link && (
                          <div className="mt-1 text-xs text-blue-600">
                            📹 Comité virtual
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(meeting.status)}`}>
                        {meeting.status === 'scheduled' ? 'Programada' : meeting.status}
                      </span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Solicitudes Pendientes */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Solicitudes Pendientes</h3>
            </div>
            <Link href={`/center/${resolvedParams.centerSlug}/dashboard/solicitudes`}>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Ver todas →
              </button>
            </Link>
          </div>

          {loadingSolicitudes ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 border-b-2 border-blue-600 rounded-full animate-spin" />
            </div>
          ) : pendingSolicitudes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No hay solicitudes pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSolicitudes.slice(0, 3).map((solicitud) => (
                <Link 
                  key={solicitud.id}
                  href={`/center/${resolvedParams.centerSlug}/dashboard/solicitudes/${solicitud.id}`}
                >
                  <motion.div
                    className="p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 line-clamp-1">{solicitud.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{solicitud.description}</p>
                        <div className="flex items-center mt-2 text-sm text-gray-600">
                          <span className={`font-medium ${getPriorityColor(solicitud.priority)}`}>
                            {solicitud.priority.toUpperCase()}
                          </span>
                          <span className="mx-2">•</span>
                          <span>{new Date(solicitud.created_at).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(solicitud.status)}`}>
                        {solicitud.status.replace('_', ' ')}
                      </span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Gráficos */}
      <motion.div 
        className="space-y-6"
        variants={itemVariants}
      >
        <h3 className="text-lg font-medium text-gray-900 mt-4">Estadísticas y Gráficos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            className="bg-white p-4 rounded-lg shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
          >
            <h4 className="text-lg font-medium mb-4">Fichas Creadas por Mes</h4>
            <div className="h-72">
              <DashboardChart 
                type="line"
                data={MOCK_DATA.chartData.formsCreatedByMonth}
              />
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-white p-4 rounded-lg shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
          >
            <h4 className="text-lg font-medium mb-4">Actividad de Usuarios por Día</h4>
            <div className="h-72">
              <DashboardChart 
                type="bar"
                data={MOCK_DATA.chartData.userActivityByDay}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}