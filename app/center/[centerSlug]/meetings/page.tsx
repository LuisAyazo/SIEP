'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Clock, MapPin, Users, Plus, Video, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Meeting {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_platform?: string;
  meeting_url?: string;
  center: {
    id: string;
    name: string;
    slug: string;
  };
  created_by_user: {
    id: string;
    email: string;
    full_name: string;
  };
  meeting_participants: Array<{
    id: string;
    role: string;
    attendance_status: string;
    user: {
      id: string;
      email: string;
      full_name: string;
    };
  }>;
}

export default function MeetingsPage({
  params
}: {
  params: Promise<{ centerSlug: string }>
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClient();
  
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [centerId, setCenterId] = useState<string>('');

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (centerId) {
      loadMeetings();
    }
  }, [centerId, selectedStatus]);

  async function loadCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Obtener el centro actual
      const { data: centers } = await supabase
        .from('centers')
        .select('id')
        .eq('slug', resolvedParams.centerSlug)
        .single();

      if (centers) {
        setCenterId(centers.id);
      }
    } catch (err) {
      console.error('Error al cargar usuario:', err);
    }
  }

  async function loadMeetings() {
    try {
      setLoading(true);
      setError('');

      let url = `/api/meetings?center_id=${centerId}`;
      if (selectedStatus !== 'all') {
        url += `&status=${selectedStatus}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar comités');
      }

      setMeetings(data.meetings || []);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const badges: Record<string, { label: string; className: string; icon: any }> = {
      scheduled: {
        label: 'Programada',
        className: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300',
        icon: Clock
      },
      in_progress: {
        label: 'En Progreso',
        className: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300',
        icon: CheckCircle
      },
      completed: {
        label: 'Completada',
        className: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
        icon: CheckCircle
      },
      cancelled: {
        label: 'Cancelada',
        className: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300',
        icon: XCircle
      }
    };

    const badge = badges[status] || badges.scheduled;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  }

  function getAttendanceStats(meeting: Meeting) {
    const total = meeting.meeting_participants.length;
    const accepted = meeting.meeting_participants.filter(p => p.attendance_status === 'accepted').length;
    const declined = meeting.meeting_participants.filter(p => p.attendance_status === 'declined').length;
    const pending = meeting.meeting_participants.filter(p => p.attendance_status === 'invited').length;

    return { total, accepted, declined, pending };
  }

  function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }

  // Componente de Skeleton Loader
  const MeetingSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
      </div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
        </div>

        {/* Filtros Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        </div>

        {/* Reuniones Skeleton */}
        <div className="grid gap-4">
          <MeetingSkeleton />
          <MeetingSkeleton />
          <MeetingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Comités</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestiona los comités del centro</p>
        </div>
        <button
          onClick={() => router.push(`/center/${resolvedParams.centerSlug}/meetings/create`)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Comité
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todas</option>
              <option value="scheduled">Programadas</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Lista de Reuniones */}
      {meetings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center"
        >
          <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay comités
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Crea tu primer comité para comenzar
          </p>
          <button
            onClick={() => router.push(`/center/${resolvedParams.centerSlug}/meetings/create`)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Nuevo Comité
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {meetings.map((meeting, index) => {
            const { date, time } = formatDateTime(meeting.scheduled_at);
            const stats = getAttendanceStats(meeting);
            const isOrganizer = meeting.meeting_participants.some(
              p => p.user?.id === currentUser?.id && p.role === 'organizer'
            );

            return (
              <div
                key={meeting.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/center/${resolvedParams.centerSlug}/meetings/${meeting.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {meeting.title}
                      </h3>
                      {getStatusBadge(meeting.status)}
                      {isOrganizer && (
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 text-xs font-medium rounded-full">
                          Organizador
                        </span>
                      )}
                    </div>
                    {meeting.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{meeting.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {date}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    {time} ({meeting.duration_minutes} min)
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    {stats.accepted}/{stats.total} confirmados
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Organizado por {meeting.created_by_user.full_name}</span>
                  {meeting.meeting_url && (
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <Video className="w-3 h-3" />
                      <span className="font-medium">{meeting.meeting_platform || 'Virtual'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}