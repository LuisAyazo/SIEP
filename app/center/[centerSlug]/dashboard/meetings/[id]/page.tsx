'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Edit,
  Trash2,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

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
    notes?: string;
    user: {
      id: string;
      email: string;
      full_name: string;
    };
  }>;
}

export default function MeetingDetailPage({
  params
}: {
  params: Promise<{ centerSlug: string; id: string }>
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    loadMeeting();
  }, []);

  async function loadCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (err) {
      console.error('Error al cargar usuario:', err);
    }
  }

  async function loadMeeting() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/meetings/${resolvedParams.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar reunión');
      }

      setMeeting(data.meeting);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateAttendance(status: string) {
    if (!currentUser || !meeting) return;

    try {
      setUpdatingStatus(true);

      const response = await fetch(
        `/api/meetings/${meeting.id}/participants/${currentUser.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            attendance_status: status
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar asistencia');
      }

      // Recargar reunión
      await loadMeeting();
    } catch (err: any) {
      console.error('Error:', err);
      alert(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleCancelMeeting() {
    if (!meeting) return;

    if (!confirm('¿Estás seguro de que deseas cancelar esta reunión?')) {
      return;
    }

    try {
      const response = await fetch(`/api/meetings/${meeting.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar reunión');
      }

      router.push(`/center/${resolvedParams.centerSlug}/dashboard/meetings`);
    } catch (err: any) {
      console.error('Error:', err);
      alert(err.message);
    }
  }

  function getStatusBadge(status: string) {
    const badges: Record<string, { label: string; className: string; icon: any }> = {
      scheduled: {
        label: 'Programada',
        className: 'bg-blue-100 text-blue-800',
        icon: Clock
      },
      in_progress: {
        label: 'En Progreso',
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle
      },
      completed: {
        label: 'Completada',
        className: 'bg-gray-100 text-gray-800',
        icon: CheckCircle
      },
      cancelled: {
        label: 'Cancelada',
        className: 'bg-red-100 text-red-800',
        icon: XCircle
      }
    };

    const badge = badges[status] || badges.scheduled;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  }

  function getAttendanceStatusBadge(status: string) {
    const badges: Record<string, { label: string; className: string }> = {
      invited: { label: 'Invitado', className: 'bg-gray-100 text-gray-800' },
      accepted: { label: 'Aceptado', className: 'bg-green-100 text-green-800' },
      declined: { label: 'Rechazado', className: 'bg-red-100 text-red-800' },
      maybe: { label: 'Tal vez', className: 'bg-yellow-100 text-yellow-800' },
      attended: { label: 'Asistió', className: 'bg-blue-100 text-blue-800' },
      not_attended: { label: 'No asistió', className: 'bg-gray-100 text-gray-800' }
    };

    const badge = badges[status] || badges.invited;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  }

  function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-CO', {
        weekday: 'long',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando reunión...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        {error || 'Reunión no encontrada'}
      </div>
    );
  }

  const { date, time } = formatDateTime(meeting.scheduled_at);
  const isCreator = meeting.created_by_user.id === currentUser?.id;
  const currentParticipant = meeting.meeting_participants.find(p => p.user.id === currentUser?.id);
  const isOrganizer = currentParticipant?.role === 'organizer';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{meeting.title}</h1>
            <p className="text-gray-600 mt-1">Detalles de la reunión</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(meeting.status)}
          {isCreator && meeting.status === 'scheduled' && (
            <button
              onClick={handleCancelMeeting}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Cancelar Reunión
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de la reunión */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Información</h2>
            
            {meeting.description && (
              <div>
                <p className="text-gray-700">{meeting.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-medium text-gray-900 capitalize">{date}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Hora</p>
                  <p className="font-medium text-gray-900">{time} ({meeting.duration_minutes} min)</p>
                </div>
              </div>

              {meeting.meeting_platform && (
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Plataforma</p>
                    <p className="font-medium text-gray-900">{meeting.meeting_platform}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Centro</p>
                  <p className="font-medium text-gray-900">{meeting.center.name}</p>
                </div>
              </div>
            </div>

            {meeting.meeting_url && (
              <div className="pt-4 border-t">
                <a
                  href={meeting.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Video className="w-4 h-4" />
                  Unirse a la reunión
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          {/* Participantes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participantes ({meeting.meeting_participants.length})
              </h2>
            </div>

            <div className="space-y-3">
              {meeting.meeting_participants.map(participant => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-semibold">
                        {participant.user.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{participant.user.full_name}</p>
                      <p className="text-sm text-gray-500">{participant.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {participant.role === 'organizer' && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                        Organizador
                      </span>
                    )}
                    {getAttendanceStatusBadge(participant.attendance_status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mi estado */}
          {currentParticipant && meeting.status === 'scheduled' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mi Respuesta</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleUpdateAttendance('accepted')}
                  disabled={updatingStatus}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentParticipant.attendance_status === 'accepted'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Aceptar
                </button>
                <button
                  onClick={() => handleUpdateAttendance('maybe')}
                  disabled={updatingStatus}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentParticipant.attendance_status === 'maybe'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  Tal vez
                </button>
                <button
                  onClick={() => handleUpdateAttendance('declined')}
                  disabled={updatingStatus}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentParticipant.attendance_status === 'declined'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Rechazar
                </button>
              </div>
            </div>
          )}

          {/* Organizador */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizador</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-700 font-semibold text-lg">
                  {meeting.created_by_user.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{meeting.created_by_user.full_name}</p>
                <p className="text-sm text-gray-500">{meeting.created_by_user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}