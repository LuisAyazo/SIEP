'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  User, 
  Flag, 
  Download,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  AlertCircle
} from 'lucide-react';

interface Solicitud {
  id: string;
  title: string;
  description: string;
  tipo: string;
  status: string;
  priority: string;
  deadline: string | null;
  file_url: string;
  file_name: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  created_by_profile: {
    id: string;
    full_name: string;
    email: string;
  };
  center: {
    id: string;
    name: string;
    slug: string;
  };
  assigned_to_profile?: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface Comment {
  id: string;
  comment: string;
  comment_type: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
}

export default function SolicitudDetailPage({
  params
}: {
  params: Promise<{ centerSlug: string; id: string }>
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('aclaracion');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // Verificar si es admin
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', user.id)
          .single();

        setIsAdmin((userRole as any)?.roles?.name === 'administrador');
      }

      // Cargar solicitud
      await loadSolicitud();
      
      // Cargar comentarios
      await loadComments();

    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar la solicitud');
    } finally {
      setLoading(false);
    }
  }

  async function loadSolicitud() {
    const response = await fetch(`/api/solicitudes/${resolvedParams.id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    setSolicitud(data.solicitud);
  }

  async function loadComments() {
    const response = await fetch(`/api/solicitudes/${resolvedParams.id}/comments`);
    const data = await response.json();

    if (response.ok) {
      setComments(data.comments || []);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);

      const response = await fetch(`/api/solicitudes/${resolvedParams.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment: newComment,
          comment_type: commentType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      // Recargar comentarios
      await loadComments();
      
      // Limpiar formulario
      setNewComment('');
      setCommentType('aclaracion');

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove() {
    if (!confirm('¿Estás seguro de aprobar esta solicitud?')) return;

    try {
      const response = await fetch(`/api/solicitudes/${resolvedParams.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      await loadSolicitud();
      await loadComments();

    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleReject() {
    const reason = prompt('Ingresa el motivo del rechazo:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/solicitudes/${resolvedParams.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      await loadSolicitud();
      await loadComments();

    } catch (err: any) {
      setError(err.message);
    }
  }

  function getStatusBadge(status: string) {
    const badges: Record<string, { label: string; className: string; icon: any }> = {
      pendiente: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      en_revision: { label: 'En Revisión', className: 'bg-blue-100 text-blue-800', icon: MessageSquare },
      aprobada: { label: 'Aprobada', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      rechazada: { label: 'Rechazada', className: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const badge = badges[status] || badges.pendiente;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  }

  function getPriorityBadge(priority: string) {
    const badges: Record<string, { label: string; className: string }> = {
      low: { label: 'Baja', className: 'bg-blue-100 text-blue-800' },
      normal: { label: 'Normal', className: 'bg-gray-100 text-gray-800' },
      high: { label: 'Alta', className: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgente', className: 'bg-red-100 text-red-800' }
    };

    const badge = badges[priority] || badges.normal;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badge.className}`}>
        <Flag className="w-3 h-3" />
        {badge.label}
      </span>
    );
  }

  function getCommentTypeBadge(type: string) {
    const types: Record<string, { label: string; className: string }> = {
      aprobacion: { label: 'Aprobación', className: 'bg-green-100 text-green-800' },
      rechazo: { label: 'Rechazo', className: 'bg-red-100 text-red-800' },
      revision: { label: 'Revisión', className: 'bg-blue-100 text-blue-800' },
      aclaracion: { label: 'Aclaración', className: 'bg-gray-100 text-gray-800' }
    };

    const badge = types[type] || types.aclaracion;

    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  }

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
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Solicitud no encontrada</h2>
        <p className="text-gray-600 mb-6">La solicitud que buscas no existe o no tienes acceso</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{solicitud.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            {getStatusBadge(solicitud.status)}
            {getPriorityBadge(solicitud.priority)}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detalles */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Detalles</h2>

            {solicitud.description && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Descripción</p>
                <p className="text-gray-600">{solicitud.description}</p>
              </div>
            )}

            {solicitud.tipo && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Tipo</p>
                <p className="text-gray-600">{solicitud.tipo}</p>
              </div>
            )}

            {solicitud.deadline && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha Límite
                </p>
                <p className="text-gray-600">
                  {new Date(solicitud.deadline).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {/* Archivo */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documento Adjunto
              </p>
              <a
                href={solicitud.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                {solicitud.file_name}
                <span className="text-xs text-blue-600">
                  ({(solicitud.file_size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </a>
            </div>
          </div>

          {/* Comentarios */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5" />
              Comentarios ({comments.length})
            </h2>

            {/* Lista de comentarios */}
            <div className="space-y-4 mb-6">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay comentarios todavía</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{comment.user.full_name}</span>
                        {getCommentTypeBadge(comment.comment_type)}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString('es-ES')}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Formulario de nuevo comentario */}
            <form onSubmit={handleAddComment} className="border-t pt-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Comentario
                </label>
                <select
                  value={commentType}
                  onChange={(e) => setCommentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="aclaracion">Aclaración</option>
                  <option value="revision">Revisión</option>
                  {isAdmin && <option value="aprobacion">Aprobación</option>}
                  {isAdmin && <option value="rechazo">Rechazo</option>}
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comentario
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Escribe tu comentario..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Enviando...' : 'Enviar Comentario'}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Información */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Información</h3>

            <div>
              <p className="text-sm text-gray-600 mb-1">Creado por</p>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{solicitud.created_by_profile.full_name}</p>
                  <p className="text-xs text-gray-500">{solicitud.created_by_profile.email}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Centro</p>
              <p className="font-medium text-gray-900">{solicitud.center.name}</p>
            </div>

            {solicitud.assigned_to_profile && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Asignado a</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">{solicitud.assigned_to_profile.full_name}</p>
                    <p className="text-xs text-gray-500">{solicitud.assigned_to_profile.email}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600 mb-1">Fecha de creación</p>
              <p className="text-gray-900">
                {new Date(solicitud.created_at).toLocaleString('es-ES')}
              </p>
            </div>

            {solicitud.reviewed_at && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Fecha de revisión</p>
                <p className="text-gray-900">
                  {new Date(solicitud.reviewed_at).toLocaleString('es-ES')}
                </p>
              </div>
            )}
          </div>

          {/* Acciones (solo para admin) */}
          {isAdmin && solicitud.status === 'pendiente' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-3">
              <h3 className="font-semibold text-gray-900 mb-4">Acciones</h3>

              <button
                onClick={handleApprove}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Aprobar Solicitud
              </button>

              <button
                onClick={handleReject}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Rechazar Solicitud
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}