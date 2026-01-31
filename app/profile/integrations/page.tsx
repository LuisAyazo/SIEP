'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Verificar si hay mensajes de Google OAuth
    const googleSuccess = searchParams.get('google_success');
    const googleError = searchParams.get('google_error');

    if (googleSuccess) {
      setMessage({ type: 'success', text: 'Google Calendar conectado exitosamente' });
      setIsConnected(true);
    } else if (googleError) {
      const errorMessages: Record<string, string> = {
        access_denied: 'Acceso denegado por el usuario',
        missing_params: 'Parámetros faltantes en la respuesta',
        unauthorized: 'No autorizado',
        save_failed: 'Error al guardar los tokens',
        invalid_domain: 'Debes usar una cuenta de Google con correo @unicartagena.edu.co',
        email_mismatch: 'El correo de Google debe coincidir con tu correo en el sistema',
        unknown: 'Error desconocido'
      };
      setMessage({
        type: 'error',
        text: errorMessages[googleError] || 'Error al conectar con Google Calendar'
      });
    }

    // Verificar si el usuario ya tiene Google Calendar conectado
    checkGoogleConnection();
  }, [searchParams]);

  const checkGoogleConnection = async () => {
    try {
      const response = await fetch('/api/google/status');
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
      }
    } catch (error) {
      console.error('Error al verificar conexión:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/google/auth');
      
      if (!response.ok) {
        throw new Error('Error al obtener URL de autenticación');
      }

      const data = await response.json();
      
      // Redirigir a la URL de autenticación de Google
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error al iniciar conexión con Google Calendar' 
      });
      setIsLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm('¿Estás seguro de que deseas desconectar Google Calendar?')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/google/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al desconectar');
      }

      setIsConnected(false);
      setMessage({ 
        type: 'success', 
        text: 'Google Calendar desconectado exitosamente' 
      });
    } catch (error) {
      console.error('Error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error al desconectar Google Calendar' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Integraciones</h1>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <svg className="w-12 h-12" viewBox="0 0 48 48">
                <path fill="#1976D2" d="M24,4C13,4,4,13,4,24s9,20,20,20s20-9,20-20S35,4,24,4z"/>
                <path fill="#FFF" d="M33.14,25.59c0-0.59-0.05-1.16-0.14-1.71H24v3.23h5.11c-0.22,1.19-0.9,2.2-1.91,2.87v2.69h3.09C32.19,30.89,33.14,28.47,33.14,25.59z"/>
                <path fill="#FFF" d="M24,34c2.43,0,4.47-0.8,5.96-2.18l-2.91-2.26c-0.81,0.54-1.84,0.86-3.05,0.86c-2.35,0-4.34-1.59-5.05-3.72h-3.01v2.33C17.43,31.97,20.48,34,24,34z"/>
                <path fill="#FFF" d="M18.95,26.7c-0.18-0.54-0.28-1.11-0.28-1.7s0.1-1.16,0.28-1.7v-2.33h-3.01C15.33,22.11,15,23.02,15,24s0.33,1.89,0.94,2.73L18.95,26.7z"/>
                <path fill="#FFF" d="M24,17.38c1.32,0,2.51,0.45,3.44,1.35l2.58-2.58C28.46,14.6,26.42,13.8,24,13.8c-3.52,0-6.57,2.03-8.06,4.97l3.01,2.33C19.66,18.97,21.65,17.38,24,17.38z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Google Calendar</h2>
              <p className="text-gray-600 mb-4">
                Sincroniza automáticamente tus reuniones con Google Calendar. 
                Los eventos se crearán automáticamente cuando crees una reunión.
              </p>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Conectado' : 'No conectado'}
                </span>
              </div>
            </div>
          </div>

          <div>
            {isConnected ? (
              <button
                onClick={handleDisconnectGoogle}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Desconectando...' : 'Desconectar'}
              </button>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <span>Conectando...</span>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
                    </svg>
                    <span>Conectar</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {isConnected && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">✅ Sincronización activa</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Las nuevas reuniones se crearán automáticamente en tu Google Calendar</li>
              <li>• Los participantes recibirán invitaciones por email</li>
              <li>• Los cambios en las reuniones se sincronizarán automáticamente</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
