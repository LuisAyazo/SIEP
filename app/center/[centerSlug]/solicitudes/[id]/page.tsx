'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCenterContext } from '@/components/providers/CenterContext';
import { useSupabaseSession } from '@/components/providers/SessionProvider';
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
  DocumentArrowUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Solicitud {
  id: string;
  tipo_solicitud: string;
  nombre_proyecto?: string;
  status: 'nuevo' | 'recibido' | 'en_comite' | 'observado' | 'aprobado' | 'rechazado' | 'cancelado';
  observaciones?: string;
  created_at: string;
  created_by_profile?: {
    id: string;
    full_name?: string;
    email: string;
  };
  center?: {
    id: string;
    name: string;
    slug: string;
  };
  assigned_to_profile?: {
    id: string;
    full_name?: string;
    email: string;
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

interface Meeting {
  id: string;
  title: string;
  scheduled_at: string;
  status: string;
}

export default function SolicitudDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { currentCenter } = useCenterContext() || {};
  const { session } = useSupabaseSession();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comentario, setComentario] = useState('');
  const [actaFile, setActaFile] = useState<File | null>(null);
  const [showModificacionModal, setShowModificacionModal] = useState(false);
  const [motivoModificacion, setMotivoModificacion] = useState('');
  const [descripcionModificacion, setDescripcionModificacion] = useState('');
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [showComiteModal, setShowComiteModal] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [loadingMeetings, setLoadingMeetings] = useState(false);

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
      if (!response.ok) {
        console.error('Error al cargar historial:', response.status);
        setHistorial([]); // Establecer array vacío si falla
        return;
      }
      const data = await response.json();
      setHistorial(data.historial || []);
    } catch (error) {
      console.error('Error:', error);
      setHistorial([]); // Establecer array vacío si hay error
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

  const loadMeetings = async () => {
    if (!currentCenter?.id) return;
    
    setLoadingMeetings(true);
    try {
      const response = await fetch(`/api/meetings?center_id=${currentCenter.id}&status=scheduled`);
      if (!response.ok) throw new Error('Error al cargar comités');
      const data = await response.json();
      setMeetings(data.meetings || []);
    } catch (error) {
      console.error('Error:', error);
      setMeetings([]);
    } finally {
      setLoadingMeetings(false);
    }
  };

  const handleOpenComiteModal = async () => {
    setShowComiteModal(true);
    await loadMeetings();
  };

  const handleEnviarComite = async () => {
    if (!selectedMeetingId) {
      alert('Debe seleccionar un comité');
      return;
    }

    if (!confirm('¿Enviar esta solicitud al comité seleccionado?')) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/solicitudes/${solicitudId}/enviar-comite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comentario,
          meeting_id: selectedMeetingId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar a comité');
      }

      alert('Solicitud enviada al comité exitosamente');
      setComentario('');
      setShowComiteModal(false);
      setSelectedMeetingId('');
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

  const handleSolicitarModificacion = async () => {
    const motivo = motivoSeleccionado === 'otro' ? motivoModificacion : motivoSeleccionado;
    
    if (!motivo.trim()) {
      alert('Debe proporcionar un motivo para la solicitud de modificación');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/solicitudes/${solicitudId}/solicitar-modificacion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivo,
          descripcion: descripcionModificacion
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al solicitar modificación');
      }

      alert('✅ Solicitud de modificación registrada exitosamente');
      setShowModificacionModal(false);
      setMotivoModificacion('');
      setDescripcionModificacion('');
      setMotivoSeleccionado('');
      loadSolicitud();
      loadHistorial();
    } catch (error: any) {
      console.error('Error:', error);
      alert('❌ ' + error.message);
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

  const creadorNombre = solicitud.created_by_profile?.full_name ||
                        solicitud.created_by_profile?.email ||
                        'Desconocido';
  
  const asignadoNombre = solicitud.assigned_to_profile?.full_name ||
                         solicitud.assigned_to_profile?.email ||
                         'No asignado';

  // Verificar si el usuario actual es el creador
  const esCreador = session?.user?.id === solicitud.created_by_profile?.id;
  
  // Verificar si puede cancelar (es creador y no está en estado final)
  const puedeCancelar = esCreador && !['aprobado', 'rechazado', 'cancelado'].includes(solicitud.status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Solicitud #{solicitud.id.slice(0, 8)}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Creada el {new Date(solicitud.created_at).toLocaleDateString('es-CO')}
              </p>
            </div>
            <EstadoBadge estado={solicitud.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información General */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Información General
              </h2>
              
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de Solicitud</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 capitalize">
                    {solicitud.tipo_solicitud.replace(/_/g, ' ')}
                  </dd>
                </div>
                
                {solicitud.nombre_proyecto && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre del Proyecto</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {solicitud.nombre_proyecto}
                    </dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Creado por</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{creadorNombre}</dd>
                </div>
                
                {solicitud.center && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Centro</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{solicitud.center.name}</dd>
                  </div>
                )}
                
                {solicitud.assigned_to_profile && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Asignado a</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{asignadoNombre}</dd>
                  </div>
                )}
              </dl>

              {solicitud.observaciones && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Observaciones
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 whitespace-pre-wrap">
                    {solicitud.observaciones}
                  </p>
                </div>
              )}
            </div>

            {/* Documentos */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Documentos Adjuntos
              </h2>
              <DocumentosList solicitudId={solicitudId} />
            </div>

            {/* Historial */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Historial de Cambios
              </h2>
              <HistorialTimeline solicitudId={solicitudId} />
            </div>
          </div>

          {/* Columna de Acciones */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Acciones
              </h2>

              {/* Área de comentarios/observaciones */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comentario / Observaciones
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Agregar comentario..."
                />
              </div>

              {/* Acciones según estado */}
              <div className="space-y-3">
                {/* Director: Aceptar y enviar a Centro de Servicios (nuevo → recibido) */}
                {solicitud.status === 'nuevo' && (
                  <>
                    <button
                      onClick={handleRecibir}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Aceptar y Enviar a Centro de Servicios
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

                {/* Centro de Servicios: Solicitar aprobación al comité (recibido → en_comite) */}
                {solicitud.status === 'recibido' && (
                  <>
                    <button
                      onClick={handleOpenComiteModal}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                    >
                      <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                      Aceptar y Enviar a Comité
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
                {solicitud.status === 'en_comite' && (
                  <>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Acta de Comité (requerida para aprobar)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setActaFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-200 hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
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
                {solicitud.status === 'observado' && (
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
                {(solicitud.status === 'aprobado' || solicitud.status === 'rechazado' || solicitud.status === 'cancelado') && (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                    No hay acciones disponibles para solicitudes {
                      solicitud.status === 'aprobado' ? 'aprobadas' :
                      solicitud.status === 'rechazado' ? 'rechazadas' :
                      'canceladas'
                    }
                  </div>
                )}

                {/* Botón de solicitar modificación para el creador */}
                {puedeCancelar && (
                  <button
                    onClick={() => setShowModificacionModal(true)}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 mt-3"
                  >
                    <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                    Solicitar Modificación
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Solicitud de Modificación */}
      {showModificacionModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Solicitar Modificación
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Selecciona el motivo por el cual solicitas modificaciones a esta solicitud:
            </p>

            <div className="space-y-3 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="motivo"
                  value="Información incompleta"
                  checked={motivoSeleccionado === 'Información incompleta'}
                  onChange={(e) => setMotivoSeleccionado(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Información incompleta</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="motivo"
                  value="Documentos faltantes"
                  checked={motivoSeleccionado === 'Documentos faltantes'}
                  onChange={(e) => setMotivoSeleccionado(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Documentos faltantes</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="motivo"
                  value="Datos incorrectos"
                  checked={motivoSeleccionado === 'Datos incorrectos'}
                  onChange={(e) => setMotivoSeleccionado(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Datos incorrectos</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="motivo"
                  value="otro"
                  checked={motivoSeleccionado === 'otro'}
                  onChange={(e) => setMotivoSeleccionado(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Otro motivo</span>
              </label>

              {motivoSeleccionado === 'otro' && (
                <textarea
                  value={motivoModificacion}
                  onChange={(e) => setMotivoModificacion(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Describe el motivo..."
                />
              )}

              {/* Campo adicional para descripción detallada */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción adicional (opcional)
                </label>
                <textarea
                  value={descripcionModificacion}
                  onChange={(e) => setDescripcionModificacion(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Agrega detalles sobre las modificaciones requeridas..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModificacionModal(false);
                  setMotivoModificacion('');
                  setDescripcionModificacion('');
                  setMotivoSeleccionado('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={actionLoading}
              >
                Cerrar
              </button>
              <button
                onClick={handleSolicitarModificacion}
                disabled={actionLoading || !motivoSeleccionado || (motivoSeleccionado === 'otro' && !motivoModificacion.trim())}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
              >
                {actionLoading ? 'Enviando...' : 'Solicitar Modificación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Selección de Comité */}
      {showComiteModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Seleccionar Comité
            </h3>
            
            {loadingMeetings ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Cargando comités...</p>
              </div>
            ) : meetings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No hay comités programados aún
                </p>
                <button
                  onClick={() => {
                    const centerSlug = currentCenter?.slug || 'centro-servicios';
                    router.push(`/center/${centerSlug}/meetings/create`);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Crear Nuevo Comité
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Selecciona el comité al que deseas enviar esta solicitud:
                </p>

                <div className="space-y-2 mb-4">
                  {meetings.map((meeting) => (
                    <label
                      key={meeting.id}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedMeetingId === meeting.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="meeting"
                        value={meeting.id}
                        checked={selectedMeetingId === meeting.id}
                        onChange={(e) => setSelectedMeetingId(e.target.value)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {meeting.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          📅 {new Date(meeting.scheduled_at).toLocaleDateString('es-CO', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowComiteModal(false);
                      setSelectedMeetingId('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    disabled={actionLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEnviarComite}
                    disabled={actionLoading || !selectedMeetingId}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Enviando...' : 'Enviar a Comité'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}