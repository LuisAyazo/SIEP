'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseSession } from '@/components/providers/SessionProvider';
import EstadoBadge from '@/components/solicitudes/EstadoBadge';
import HistorialTimeline from '@/components/solicitudes/HistorialTimeline';
import DocumentosList from '@/components/solicitudes/DocumentosList';
import { ArrowLeft, FileText, Calendar, User } from 'lucide-react';
import Image from 'next/image';

interface Solicitud {
  id: string;
  tipo_solicitud: string;
  metodo_ficha_tecnica: string;
  estado: string;
  observaciones?: string;
  created_at: string;
  title?: string;
  description?: string;
  priority?: string;
  funcionario: {
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
  };
}

export default function SolicitudDetallePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { session, loading: authLoading } = useSupabaseSession();
  
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Verificar autenticación
  useEffect(() => {
    if (!authLoading && !session) {
      router.replace('/login');
    }
  }, [session, authLoading, router]);

  useEffect(() => {
    if (session && resolvedParams.id) {
      loadSolicitud();
    }
  }, [session, resolvedParams.id]);

  async function loadSolicitud() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/solicitudes/${resolvedParams.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar solicitud');
      }

      setSolicitud(data.solicitud);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getTipoLabel(tipo: string) {
    const labels: Record<string, string> = {
      'diplomado_proyeccion_social': 'Diplomado - Proyección Social',
      'diplomado_extension': 'Diplomado - Extensión',
      'contrato': 'Contrato',
      'convenio': 'Convenio'
    };
    return labels[tipo] || tipo;
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Image
                  src="/images/logo-oficial.png"
                  alt="Logo Universidad"
                  width={50}
                  height={50}
                  className="object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Sistema de Gestión
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando solicitud...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Image
                  src="/images/logo-oficial.png"
                  alt="Logo Universidad"
                  width={50}
                  height={50}
                  className="object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Sistema de Gestión
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
            <p className="font-semibold">Error al cargar la solicitud</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => router.push('/solicitudes')}
              className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
            >
              ← Volver a Mis Solicitudes
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!solicitud) {
    return null;
  }

  const funcionarioNombre = solicitud.funcionario?.raw_user_meta_data?.full_name || 
                            solicitud.funcionario?.email || 
                            'Desconocido';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Simple */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src="/images/logo-oficial.png"
                alt="Logo Universidad"
                width={50}
                height={50}
                className="object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Sistema de Gestión
                </h1>
                <p className="text-sm text-gray-500">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/solicitudes')}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Mis Solicitudes
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header de Solicitud */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    #{solicitud.id.slice(0, 8)}
                  </span>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {solicitud.title || getTipoLabel(solicitud.tipo_solicitud)}
                  </h1>
                </div>
                {solicitud.description && (
                  <p className="text-gray-600 mt-2">{solicitud.description}</p>
                )}
              </div>
              <EstadoBadge estado={solicitud.estado as any} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Tipo</p>
                  <p className="text-sm font-medium text-gray-900">
                    {getTipoLabel(solicitud.tipo_solicitud)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Creada</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(solicitud.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Creada por</p>
                  <p className="text-sm font-medium text-gray-900">
                    {funcionarioNombre}
                  </p>
                </div>
              </div>
            </div>

            {solicitud.observaciones && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-1">Observaciones:</p>
                <p className="text-sm text-gray-600">{solicitud.observaciones}</p>
              </div>
            )}
          </div>

          {/* Documentos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentos Adjuntos</h2>
            <DocumentosList solicitudId={solicitud.id} />
          </div>

          {/* Historial */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de Cambios</h2>
            <HistorialTimeline solicitudId={solicitud.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
