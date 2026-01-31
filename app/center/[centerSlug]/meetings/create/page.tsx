'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Clock, Users, Video, AlertCircle, ArrowLeft, Search } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
}

export default function CreateMeetingPage({
  params
}: {
  params: Promise<{ centerSlug: string }>
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [centerId, setCenterId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [showGoogleBanner, setShowGoogleBanner] = useState(true);
  const [externalEmails, setExternalEmails] = useState<string[]>([]);
  const [newExternalEmail, setNewExternalEmail] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 60,
    meeting_platform: '',
    meeting_url: ''
  });

  useEffect(() => {
    loadCenter();
    loadUsers();
    checkGoogleConnection();
  }, []);

  async function checkGoogleConnection() {
    try {
      const response = await fetch('/api/google/status');
      if (response.ok) {
        const data = await response.json();
        setGoogleConnected(data.connected);
      }
    } catch (err) {
      console.error('Error al verificar Google Calendar:', err);
    }
  }

  async function handleConnectGoogle() {
    try {
      // Pasar la URL actual como returnUrl
      const currentUrl = window.location.pathname;
      const response = await fetch(`/api/google/auth?returnUrl=${encodeURIComponent(currentUrl)}`);
      if (!response.ok) {
        throw new Error('Error al obtener URL de autenticación');
      }

      const data = await response.json();
      
      // Redirigir a Google para autenticación
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error al conectar Google Calendar:', error);
      setError('Error al iniciar conexión con Google Calendar');
    }
  }

  async function loadCenter() {
    try {
      const { data } = await supabase
        .from('centers')
        .select('id')
        .eq('slug', resolvedParams.centerSlug)
        .single();

      if (data) {
        setCenterId(data.id);
      }
    } catch (err) {
      console.error('Error al cargar centro:', err);
    }
  }

  async function loadUsers() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('full_name');

      if (data) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_minutes' ? parseInt(value) : value
    }));
  }

  function toggleParticipant(userId: string) {
    setSelectedParticipants(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  }

  // Filtrar usuarios por búsqueda
  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    );
  });

  function addExternalEmail() {
    const email = newExternalEmail.trim();
    if (!email) return;
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Por favor ingresa un email válido');
      return;
    }
    
    // Verificar que no esté duplicado
    if (externalEmails.includes(email)) {
      alert('Este email ya fue agregado');
      return;
    }
    
    setExternalEmails(prev => [...prev, email]);
    setNewExternalEmail('');
  }

  function removeExternalEmail(email: string) {
    setExternalEmails(prev => prev.filter(e => e !== email));
  }

  // Generar link de Google Meet automáticamente
  const generateGoogleMeetLink = (): string => {
    const startDate = new Date(formData.scheduled_at);
    const endDate = new Date(startDate.getTime() + formData.duration_minutes * 60000);
    
    const formatGoogleDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const internalEmails = selectedParticipants
      .map(id => users.find(u => u.id === id)?.email)
      .filter(Boolean);
    
    const allEmails = [...internalEmails, ...externalEmails];
    const participantEmails = allEmails.join(',');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: formData.title,
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
      details: formData.description || 'Comité programado desde SIEP',
      add: participantEmails
    });

    // Link directo para crear evento con Google Meet integrado
    return `https://calendar.google.com/calendar/render?${params.toString()}&add=conferenceData`;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.title || !formData.scheduled_at || !centerId) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let meetingUrl = formData.meeting_url;
      
      // Si seleccionó Google Meet, generar link automáticamente
      if (formData.meeting_platform === 'google_meet' && !meetingUrl) {
        meetingUrl = generateGoogleMeetLink();
      }

      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          scheduled_at: formData.scheduled_at,
          duration_minutes: formData.duration_minutes,
          center_id: centerId,
          meeting_platform: formData.meeting_platform || null,
          meeting_url: meetingUrl || null,
          participant_ids: selectedParticipants,
          external_emails: externalEmails
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear comité');
      }

      router.push(`/center/${resolvedParams.centerSlug}/meetings`);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-900 dark:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nuevo Comité</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Programa un nuevo comité del centro</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Banner de Google Calendar */}
      {!googleConnected && showGoogleBanner && (
        <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 48 48">
                  <path fill="currentColor" d="M24,4C13,4,4,13,4,24s9,20,20,20s20-9,20-20S35,4,24,4z"/>
                  <path fill="#FFF" d="M33.14,25.59c0-0.59-0.05-1.16-0.14-1.71H24v3.23h5.11c-0.22,1.19-0.9,2.2-1.91,2.87v2.69h3.09C32.19,30.89,33.14,28.47,33.14,25.59z"/>
                  <path fill="#FFF" d="M24,34c2.43,0,4.47-0.8,5.96-2.18l-2.91-2.26c-0.81,0.54-1.84,0.86-3.05,0.86c-2.35,0-4.34-1.59-5.05-3.72h-3.01v2.33C17.43,31.97,20.48,34,24,34z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-50 mb-1">
                  Sincroniza con Google Calendar
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-100 mb-3">
                  Conecta tu cuenta de Google para que tus reuniones se agreguen automáticamente a tu calendario y los participantes reciban invitaciones.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleConnectGoogle}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    Conectar ahora
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGoogleBanner(false)}
                    className="px-3 py-1.5 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-sm font-medium rounded-md transition-colors"
                  >
                    Recordar después
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowGoogleBanner(false)}
              className="flex-shrink-0 text-blue-400 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Información Básica */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Información Básica
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título del Comité *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              placeholder="Ej: Comité de Planificación Mensual"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              placeholder="Describe el objetivo y temas a tratar..."
            />
          </div>
        </div>

        {/* Fecha y Hora */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Fecha y Hora
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha y Hora *
              </label>
              <input
                type="datetime-local"
                name="scheduled_at"
                value={formData.scheduled_at}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duración (minutos) *
              </label>
              <select
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              >
                <option value={30}>30 minutos</option>
                <option value={60}>1 hora</option>
                <option value={90}>1.5 horas</option>
                <option value={120}>2 horas</option>
                <option value={180}>3 horas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Plataforma Virtual */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5" />
            Plataforma Virtual (Opcional)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plataforma
              </label>
              <select
                name="meeting_platform"
                value={formData.meeting_platform}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              >
                <option value="">Seleccionar...</option>
                <option value="google_meet">Google Meet</option>
                <option value="zoom">Zoom</option>
                <option value="teams">Microsoft Teams</option>
                <option value="jitsi">Jitsi Meet</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {formData.meeting_platform && formData.meeting_platform !== 'google_meet' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL del Comité
                </label>
                <input
                  type="url"
                  name="meeting_url"
                  value={formData.meeting_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  placeholder="https://..."
                />
              </div>
            )}
          </div>

          {/* Info Google Meet */}
          {formData.meeting_platform === 'google_meet' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <div className="flex items-start gap-3">
                <Video className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                    🎉 Google Meet se generará automáticamente
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Al crear el comité, se generará un enlace de Google Calendar con Google Meet integrado.
                    Los participantes recibirán una invitación por email con el enlace de la videollamada.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                    ✓ 100% Gratis • ✓ Sin límite de tiempo • ✓ Hasta 100 participantes
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Participantes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Participantes
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 font-normal">
              ({selectedParticipants.length} internos, {externalEmails.length} externos)
            </span>
          </h2>

          {/* Buscador */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Participantes de la organización
          </p>

          <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios disponibles'}
              </div>
            ) : (
              filteredUsers.map(user => (
                <label
                  key={user.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedParticipants.includes(user.id)}
                    onChange={() => toggleParticipant(user.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                  </div>
                </label>
              ))
            )}
          </div>

          {/* Participantes Externos */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Participantes externos (fuera de la organización)
            </h3>
            
            <div className="flex gap-2 mb-3">
              <input
                type="email"
                value={newExternalEmail}
                onChange={(e) => setNewExternalEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addExternalEmail();
                  }
                }}
                placeholder="correo@ejemplo.com"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm"
              />
              <button
                type="button"
                onClick={addExternalEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Agregar
              </button>
            </div>

            {externalEmails.length > 0 && (
              <div className="space-y-2">
                {externalEmails.map((email, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                  >
                    <span className="text-sm text-gray-900 dark:text-white">{email}</span>
                    <button
                      type="button"
                      onClick={() => removeExternalEmail(email)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando...' : 'Crear Comité'}
          </button>
        </div>
      </form>
    </div>
  );
}