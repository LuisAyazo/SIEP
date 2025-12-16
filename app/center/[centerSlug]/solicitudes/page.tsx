'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Plus, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface Solicitud {
  id: string;
  request_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  request_type: string;
  created_at: string;
  updated_at: string;
  created_by_user: {
    id: string;
    email: string;
    full_name: string;
  };
  center: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function SolicitudesPage({
  params
}: {
  params: Promise<{ centerSlug: string }>
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClient();
  
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [centerId, setCenterId] = useState<string>('');

  useEffect(() => {
    loadCenter();
  }, []);

  useEffect(() => {
    if (centerId) {
      loadSolicitudes();
    }
  }, [centerId, selectedStatus, selectedPriority]);

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

  async function loadSolicitudes() {
    try {
      setLoading(true);
      setError('');

      let url = `/api/solicitudes?center_id=${centerId}`;
      if (selectedStatus !== 'all') {
        url += `&status=${selectedStatus}`;
      }
      if (selectedPriority !== 'all') {
        url += `&priority=${selectedPriority}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar solicitudes');
      }

      setSolicitudes(data.solicitudes || []);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const badges: Record<string, { label: string; className: string; icon: any }> = {
      draft: {
        label: 'Borrador',
        className: 'bg-gray-100 text-gray-800',
        icon: FileText
      },
      pending: {
        label: 'Pendiente',
        className: 'bg-yellow-100 text-yellow-800',
        icon: Clock
      },
      in_review: {
        label: 'En Revisión',
        className: 'bg-blue-100 text-blue-800',
        icon: Eye
      },
      approved: {
        label: 'Aprobada',
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle
      },
      rejected: {
        label: 'Rechazada',
        className: 'bg-red-100 text-red-800',
        icon: XCircle
      },
      completed: {
        label: 'Completada',
        className: 'bg-purple-100 text-purple-800',
        icon: CheckCircle
      }
    };

    const badge = badges[status] || badges.draft;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  }

  function getPriorityBadge(priority: string) {
    const badges: Record<string, { label: string; className: string }> = {
      low: { label: 'Baja', className: 'bg-blue-100 text-blue-800' },
      medium: { label: 'Media', className: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'Alta', className: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgente', className: 'bg-red-100 text-red-800' }
    };

    const badge = badges[priority] || badges.low;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  // Componente de Skeleton Loader
  const SolicitudSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-5 bg-gray-200 rounded w-16"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-4 bg-gray-200 rounded w-28"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
        </div>

        {/* Filtros Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>

        {/* Solicitudes Skeleton */}
        <div className="grid gap-4">
          <SolicitudSkeleton />
          <SolicitudSkeleton />
          <SolicitudSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Solicitudes</h1>
          <p className="text-gray-600 mt-1">Gestiona las solicitudes del centro</p>
        </div>
        <button
          onClick={() => router.push(`/center/${resolvedParams.centerSlug}/solicitudes/create`)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Solicitud
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="draft">Borrador</option>
              <option value="pending">Pendiente</option>
              <option value="in_review">En Revisión</option>
              <option value="approved">Aprobada</option>
              <option value="rejected">Rechazada</option>
              <option value="completed">Completada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioridad
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Lista de Solicitudes */}
      {solicitudes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay solicitudes
          </h3>
          <p className="text-gray-600 mb-4">
            Crea tu primera solicitud para comenzar
          </p>
          <button
            onClick={() => router.push(`/center/${resolvedParams.centerSlug}/solicitudes/create`)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Solicitud
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {solicitudes.map((solicitud) => (
            <div
              key={solicitud.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/center/${resolvedParams.centerSlug}/solicitudes/${solicitud.id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-gray-500">
                      #{solicitud.request_number}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {solicitud.title}
                    </h3>
                  </div>
                  {solicitud.description && (
                    <p className="text-gray-600 line-clamp-2">{solicitud.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(solicitud.status)}
                  {getPriorityBadge(solicitud.priority)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t text-sm text-gray-600">
                <div>
                  <span className="font-medium">Tipo:</span>{' '}
                  <span className="capitalize">{solicitud.request_type.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="font-medium">Creada:</span>{' '}
                  {formatDate(solicitud.created_at)}
                </div>
                <div>
                  <span className="font-medium">Por:</span>{' '}
                  {solicitud.created_by_user.full_name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}