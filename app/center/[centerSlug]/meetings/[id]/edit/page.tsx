'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Link as LinkIcon, FileText } from 'lucide-react';
import Link from 'next/link';

export default function EditMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const centerSlug = params.centerSlug as string;
  const meetingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meeting, setMeeting] = useState<any>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [platform, setPlatform] = useState('google-meet');

  useEffect(() => {
    loadMeeting();
  }, [meetingId]);

  async function loadMeeting() {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          center:centers(id, name, slug),
          created_by_user:profiles!created_by(id, email, full_name),
          meeting_participants(
            id,
            user_id,
            external_email,
            role,
            attendance_status,
            user:profiles(id, email, full_name)
          )
        `)
        .eq('id', meetingId)
        .single();

      if (error) throw error;

      setMeeting(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setScheduledAt(data.scheduled_at.slice(0, 16)); // Format for datetime-local
      setDurationMinutes(data.duration_minutes);
      setMeetingUrl(data.meeting_url || '');
      setPlatform(data.platform || 'google-meet');
    } catch (error) {
      console.error('Error loading meeting:', error);
      alert('Error al cargar la reunión');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('meetings')
        .update({
          title,
          description,
          scheduled_at: new Date(scheduledAt).toISOString(),
          duration_minutes: durationMinutes,
          meeting_url: meetingUrl,
          platform
        })
        .eq('id', meetingId);

      if (error) throw error;

      alert('Reunión actualizada exitosamente');
      // Redirigir a la lista de meetings en lugar de detalle para evitar loop
      router.push(`/center/${centerSlug}/meetings`);
    } catch (error) {
      console.error('Error updating meeting:', error);
      alert('Error al actualizar la reunión');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando reunión...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Reunión no encontrada</p>
          <Link
            href={`/center/${centerSlug}/meetings`}
            className="mt-4 inline-block text-blue-600 hover:text-blue-700"
          >
            Volver a reuniones
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/center/${centerSlug}/meetings/${meetingId}`}
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver a la reunión
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Editar Reunión
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Título de la reunión *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ej: Reunión de comité"
            />
          </div>

          {/* Descripción */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Descripción de la reunión..."
            />
          </div>

          {/* Fecha y hora */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Fecha y hora *
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Duración (minutos) *
                </label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                  required
                  min="15"
                  step="15"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Plataforma y URL */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Plataforma *
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="google-meet">Google Meet</option>
                  <option value="zoom">Zoom</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="presencial">Presencial</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <LinkIcon className="w-4 h-4 inline mr-2" />
                  Link de la reunión
                </label>
                <input
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://meet.google.com/..."
                />
              </div>
            </div>
          </div>

          {/* Participantes (solo lectura) */}
          {meeting?.meeting_participants && meeting.meeting_participants.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Participantes ({meeting.meeting_participants.length})
              </h3>
              <div className="space-y-2">
                {meeting.meeting_participants.map((participant: any) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                          {participant.user?.full_name?.[0] || participant.external_email?.[0] || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {participant.user?.full_name || participant.external_email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {participant.user?.email || participant.external_email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {participant.external_email && (
                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">
                          Externo
                        </span>
                      )}
                      {participant.role === 'organizer' && (
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                          Organizador
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                💡 Para agregar o quitar participantes, ve a la página de detalle de la reunión
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <Link
              href={`/center/${centerSlug}/meetings`}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
