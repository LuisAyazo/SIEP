'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function GoogleCalendarNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAndShowNotification();
  }, []);

  async function checkAndShowNotification() {
    try {
      const supabase = createClient();
      
      // Verificar si el usuario está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Verificar si ya se mostró la notificación y si tiene Google conectado
      const { data: profile } = await supabase
        .from('profiles')
        .select('google_calendar_notification_shown, google_access_token')
        .eq('id', user.id)
        .single();

      // Mostrar notificación solo si:
      // 1. No se ha mostrado antes
      // 2. No tiene Google Calendar conectado
      if (profile && !profile.google_calendar_notification_shown && !profile.google_access_token) {
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Error al verificar notificación:', error);
    } finally {
      setIsLoading(false);
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
      
      // Marcar como mostrada antes de redirigir
      await dismissNotification();
      
      // Redirigir a Google para autenticación
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error al conectar Google Calendar:', error);
      // Si falla, cerrar la notificación
      setShowNotification(false);
    }
  }

  async function dismissNotification() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Marcar como mostrada
        await supabase
          .from('profiles')
          .update({ google_calendar_notification_shown: true })
          .eq('id', user.id);
      }
      
      setShowNotification(false);
    } catch (error) {
      console.error('Error al cerrar notificación:', error);
      setShowNotification(false);
    }
  }

  if (isLoading || !showNotification) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 max-w-md z-50 animate-slide-down">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-10 h-10" viewBox="0 0 48 48">
              <path fill="#1976D2" d="M24,4C13,4,4,13,4,24s9,20,20,20s20-9,20-20S35,4,24,4z"/>
              <path fill="#FFF" d="M33.14,25.59c0-0.59-0.05-1.16-0.14-1.71H24v3.23h5.11c-0.22,1.19-0.9,2.2-1.91,2.87v2.69h3.09C32.19,30.89,33.14,28.47,33.14,25.59z"/>
              <path fill="#FFF" d="M24,34c2.43,0,4.47-0.8,5.96-2.18l-2.91-2.26c-0.81,0.54-1.84,0.86-3.05,0.86c-2.35,0-4.34-1.59-5.05-3.72h-3.01v2.33C17.43,31.97,20.48,34,24,34z"/>
              <path fill="#FFF" d="M18.95,26.7c-0.18-0.54-0.28-1.11-0.28-1.7s0.1-1.16,0.28-1.7v-2.33h-3.01C15.33,22.11,15,23.02,15,24s0.33,1.89,0.94,2.73L18.95,26.7z"/>
              <path fill="#FFF" d="M24,17.38c1.32,0,2.51,0.45,3.44,1.35l2.58-2.58C28.46,14.6,26.42,13.8,24,13.8c-3.52,0-6.57,2.03-8.06,4.97l3.01,2.33C19.66,18.97,21.65,17.38,24,17.38z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              ¡Conecta Google Calendar!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Sincroniza tus reuniones automáticamente con Google Calendar y recibe recordatorios.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConnectGoogle}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Conectar ahora
              </button>
              <button
                onClick={dismissNotification}
                className="px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium rounded-md transition-colors"
              >
                Más tarde
              </button>
            </div>
          </div>
          <button
            onClick={dismissNotification}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
