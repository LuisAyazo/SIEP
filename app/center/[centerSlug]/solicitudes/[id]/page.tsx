'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCenterContext } from '@/components/providers/CenterContext';
import EstadoBadge from '@/components/solicitudes/EstadoBadge';
import DocumentosList from '@/components/solicitudes/DocumentosList';
import HistorialTimeline, { HistorialItem } from '@/components/solicitudes/HistorialTimeline';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  ArrowUturnLeftIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';

interface Solicitud {
  id: string;
  tipo: string;
  metodo_ficha_tecnica: string;
  estado: 'nuevo' | 'recibido' | 'en_comite' | 'observado' | 'aprobado' | 'rechazado';
  observaciones?: string;
  created_at: string;
  funcionario: {
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
  };
  director?: {
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
  };
  coordinador?: {
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
  };
}

interface Documento {
  id: string;
  tipo: string;
  nombre: string;
  path: string;
  size: number;
  created_at: string;
}

export default function SolicitudDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { currentCenter } = useCenterContext() || {};
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comentario, setComentario] = useState('');
  const [actaFile, setActaFile] = useState<File | null>(null);

  const solicitudId = params.id as string;

  useEffect(() => {
    loadSolicitud();
    loadDocumentos();
    loadHistorial();
  }, [solicitudId]);

  const loadSolicitud = async () => {
    try {
      const response = await fetch(`/api/solicitudes/${solicitudId}`);
      if (!response.ok) throw new Error('Error al cargar solicitud');
      const data = await response.json();
      setSolicitud(data.solicitud);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentos = async () => {
    try {
      const response = await fetch(`/api/solicitudes/${solicitudId}/documentos`);
      if (!response.ok) throw new Error('Error al cargar documentos');
      const data = await response.json();
      setDocumentos(data.documentos);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadHistorial = async () => {
    try {
      const response = await fetch(`/api/solicitudes/${solicitudId}/historial`);
      if (!response.ok) throw new Error('Error al cargar historial');
      const data = await response.json();
      setHistorial(data.historial);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleRecibir = async () => {
    if (!confirm('¿Confirmar recepción de esta solicitud?')) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/solicitudes/${solicitudId}/recibir`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al recibir solicitud');
      }

      alert('Solicitud recibida exitosamente');
      setComentario('');
      loadSolicitud();
      loadHistorial();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnviarComite = async () => {
    if (!confirm('¿Enviar esta solicitud al comité?')) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/solicitudes/${solicitudId}/enviar-comite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar a comité');
      }

      alert('Solicitud enviada al comité exitosamente');
      setComentario('');
      loadSolicitud();
      loadHistorial();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAprobar = async () => {
    if (!actaFile) {
      alert('Debe adjuntar el acta de comité');
      return;
    }

    if (!confirm('¿Aprobar esta solicitud?')) return;
    
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('acta', actaFile);
      if (comentario) formData.append('comentario', comentario);

      const response = await fetch(`/api/solicitudes/${solicitudId}/aprobar`, {
        method: 'PATCH',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al aprobar solicitud');
      }

      alert('Solicitud aprobada exitosamente');
      setComentario('');
      setActaFile(null);
      loadSolicitud();
      loadHistorial();
      loadDocumentos();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleObservar = async () => {
    if (!comentario.trim()) {
      alert('Debe agregar observaciones');
      return;
    }

    if (!confirm('¿Agregar observaciones a esta solicitud?')) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/solicitudes/${solicitudId}/observar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observaciones: comentario })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al agregar observaciones');
      }

      alert('Observaciones agregadas exitosamente');
      setComentario('');
      loadSolicitud();
      loadHistorial();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDevolver = async () => {
    if (!confirm('¿Devolver esta solicitud al funcionario para correcciones?')) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/solicitudes/${solicitudId}/devolver`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al devolver solicitud');
      }

      alert('Solicitud devuelta al funcionario exitosamente');
      setComentario('');
      loadSolicitud();
      loadHistorial();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRechazar = async () => {
    if (!comentario.trim()) {
      alert('Debe agregar un motivo de rechazo');
      return;
    }

    if (!confirm('¿Rechazar esta solicitud? Esta acción no se puede deshacer.')) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/solicitudes/${solicitudId}/rechazar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: comentario })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al rechazar solicitud');
      }

      alert('Solicitud rechazada');
      setComentario('');
      loadSolicitud();
      loadHistorial();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando solicitud...</p>
        </div>
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Solicitud no encontrada</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const funcionarioNombre = solicitud.funcionario?.raw_user_meta_data?.full_name || 
                           solicitud.funcionario?.email || 
                           'Desconocido';
  
  const directorNombre = solicitud.director?.raw_user_meta_data?.full_name || 
                        solicitud.director?.email || 
                        'No asignado';
  
  const coordinadorNombre = solicitud.coordinador?.raw_user_meta_data?.full_name || 
                           solicitud.coordinador?.email || 
                           'No asignado';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Solicitud #{solicitud.id.slice(0, 8)}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Creada el {new Date(solicitud.created_at).toLocaleDateString('es-CO')}
              </p>
            </div>
            <EstadoBadge estado={solicitud.estado} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información General */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Información General
              </h2>
              
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {solicitud.tipo.replace('_', ' ')}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Método Ficha Técnica</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {solicitud.metodo_ficha_tecnica}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Funcionario</dt>
                  <dd className="mt-1 text-sm text-gray-900">{funcionarioNombre}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Director</dt>
                  <dd className="mt-1 text-sm text-gray-900">{directorNombre}</dd>
                </div>
                
                {solicitud.coordinador && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Coordinador</dt>
                    <dd className="mt-1 text-sm text-gray-900">{coordinadorNombre}</dd>
                  </div>
                )}
              </dl>

              {solicitud.observaciones && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">
                    Observaciones
                  </h3>
                  <p className="text-sm text-yellow-700 whitespace-pre-wrap">
                    {solicitud.observaciones}
                  </p>
                </div>
              )}
            </div>

            {/* Documentos */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Documentos Adjuntos
              </h2>
              <DocumentosList documentos={documentos} solicitudId={solicitudId} />
            </div>

            {/* Historial */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Historial de Cambios
              </h2>
              <HistorialTimeline historial={historial} />
            </div>
          </div>

          {/* Columna de Acciones */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Acciones
              </h2>

              {/* Área de comentarios/observaciones */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentario / Observaciones
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Agregar comentario..."
                />
              </div>

              {/* Acciones según estado */}
              <div className="space-y-3">
                {/* Director: Recibir solicitud (nuevo → recibido) */}
                {solicitud.estado === 'nuevo' && (
                  <button
                    onClick={handleRecibir}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Recibir Solicitud
                  </button>
                )}

                {/* Director: Enviar a comité (recibido → en_comite) */}
                {solicitud.estado === 'recibido' && (
                  <>
                    <button
                      onClick={handleEnviarComite}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                    >
                      <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                      Enviar a Comité
                    </button>
                    
                    <button
                      onClick={handleRechazar}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircleIcon className="h-5 w-5 mr-2" />
                      Rechazar
                    </button>
                  </>
                )}

                {/* Comité: Aprobar, Observar o Rechazar (en_comite) */}
                {solicitud.estado === 'en_comite' && (
                  <>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Acta de Comité (requerida para aprobar)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setActaFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>

                    <button
                      onClick={handleAprobar}
                      disabled={actionLoading || !actaFile}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Aprobar
                    </button>
                    
                    <button
                      onClick={handleObservar}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                    >
                      <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                      Agregar Observaciones
                    </button>
                    
                    <button
                      onClick={handleRechazar}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircleIcon className="h-5 w-5 mr-2" />
                      Rechazar
                    </button>
                  </>
                )}

                {/* Director: Devolver al funcionario (observado → nuevo) */}
                {solicitud.estado === 'observado' && (
                  <button
                    onClick={handleDevolver}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                  >
                    <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
                    Devolver al Funcionario
                  </button>
                )}

                {/* Estados finales: sin acciones */}
                {(solicitud.estado === 'aprobado' || solicitud.estado === 'rechazado') && (
                  <div className="text-center text-sm text-gray-500 py-4">
                    No hay acciones disponibles para solicitudes {solicitud.estado === 'aprobado' ? 'aprobadas' : 'rechazadas'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}