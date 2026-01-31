'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useCenterContext } from '@/components/providers/CenterContext';
import { useSupabaseSession } from '@/components/providers/SessionProvider';
import EstadoBadge, { EstadoSolicitud } from '@/components/solicitudes/EstadoBadge';
import { Plus, Search, Filter, FileText, User } from 'lucide-react';

interface Solicitud {
  id: string;
  tipo_solicitud: string;
  nombre_proyecto?: string;
  description?: string;
  status: EstadoSolicitud;
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

export default function SolicitudesPage({
  params
}: {
  params: Promise<{ centerSlug: string }>
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { currentCenter } = useCenterContext();
  const { session } = useSupabaseSession();
  
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('all');
  const [selectedTipo, setSelectedTipo] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'recibidas' | 'mias'>('recibidas');

  useEffect(() => {
    if (currentCenter) {
      loadSolicitudes();
    }
  }, [currentCenter, selectedEstado, selectedTipo]);

  async function loadSolicitudes() {
    if (!currentCenter) {
      console.log('[SolicitudesPage] ⚠️ No hay currentCenter, esperando...');
      return;
    }
    
    try {
      setLoading(true);
      setError('');

      let url = `/api/solicitudes?center_id=${currentCenter.id}`;
      if (selectedEstado !== 'all') {
        url += `&estado=${selectedEstado}`;
      }
      if (selectedTipo !== 'all') {
        url += `&tipo=${selectedTipo}`;
      }

      console.log('[SolicitudesPage] 🔍 Cargando solicitudes:', {
        centerName: currentCenter.name,
        centerId: currentCenter.id,
        url
      });

      const response = await fetch(url);
      const data = await response.json();

      console.log('[SolicitudesPage] 📡 Response:', {
        status: response.status,
        ok: response.ok,
        data
      });

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar solicitudes');
      }

      console.log('[SolicitudesPage] ✅ Solicitudes cargadas:', data.solicitudes?.length || 0);
      setSolicitudes(data.solicitudes || []);
    } catch (err: any) {
      console.error('[SolicitudesPage] ❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
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

  // Separar solicitudes por tipo
  const solicitudesRecibidas = solicitudes.filter(s => s.created_by_profile?.id !== session?.user?.id);
  const misSolicitudes = solicitudes.filter(s => s.created_by_profile?.id === session?.user?.id);

  // Filtrar solicitudes según el tab activo
  const solicitudesDelTab = activeTab === 'recibidas' ? solicitudesRecibidas : misSolicitudes;

  // Filtrar solicitudes por búsqueda
  const filteredSolicitudes = solicitudesDelTab.filter(solicitud => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const creadorNombre = solicitud.created_by_profile?.full_name ||
                          solicitud.created_by_profile?.email || '';
    
    return (
      solicitud.id.toLowerCase().includes(searchLower) ||
      creadorNombre.toLowerCase().includes(searchLower) ||
      getTipoLabel(solicitud.tipo_solicitud).toLowerCase().includes(searchLower) ||
      (solicitud.nombre_proyecto && solicitud.nombre_proyecto.toLowerCase().includes(searchLower))
    );
  });

  // Componente de Skeleton Loader
  const SolicitudSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
      </div>
      <div className="grid grid-cols-3 gap-4 pt-4 border-t dark:border-gray-700">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
        </div>

        {/* Filtros Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Solicitudes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona las solicitudes de {currentCenter?.name}
          </p>
        </div>
        <button
          onClick={() => router.push(`/center/${resolvedParams.centerSlug}/solicitudes/create`)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nueva Solicitud
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('recibidas')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'recibidas'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Solicitudes Recibidas
              {solicitudesRecibidas.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  {solicitudesRecibidas.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('mias')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'mias'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Mis Solicitudes
              {misSolicitudes.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  {misSolicitudes.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por ID, funcionario o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Filtro por Estado */}
          <div className="w-full md:w-48">
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="nuevo">Nuevo</option>
              <option value="recibido">Recibido</option>
              <option value="en_comite">En Comité</option>
              <option value="observado">Observado</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>

          {/* Filtro por Tipo */}
          <div className="w-full md:w-64">
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los tipos</option>
              <option value="diplomado_proyeccion_social">Diplomado - Proyección Social</option>
              <option value="diplomado_extension">Diplomado - Extensión</option>
              <option value="contrato">Contrato</option>
              <option value="convenio">Convenio</option>
            </select>
          </div>
        </div>

          {/* Contador de resultados */}
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            {filteredSolicitudes.length} solicitud{filteredSolicitudes.length !== 1 ? 'es' : ''} encontrada{filteredSolicitudes.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Lista de Solicitudes */}
      {filteredSolicitudes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {solicitudes.length === 0 ? 'No hay solicitudes' : 'No se encontraron resultados'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {solicitudes.length === 0
              ? 'Crea tu primera solicitud para comenzar'
              : 'Intenta ajustar los filtros de búsqueda'
            }
          </p>
          {solicitudes.length === 0 && (
            <button
              onClick={() => router.push(`/center/${resolvedParams.centerSlug}/solicitudes/create`)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nueva Solicitud
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSolicitudes.map((solicitud) => {
            const creadorNombre = solicitud.created_by_profile?.full_name ||
                                 solicitud.created_by_profile?.email ||
                                 'Desconocido';

            return (
              <div
                key={solicitud.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all cursor-pointer hover:border-blue-300 dark:hover:border-blue-600"
                onClick={() => router.push(`/center/${resolvedParams.centerSlug}/solicitudes/${solicitud.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        #{solicitud.id.slice(0, 8)}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {getTipoLabel(solicitud.tipo_solicitud)}
                      </h3>
                    </div>
                    {solicitud.nombre_proyecto && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="font-medium">Proyecto:</span> {solicitud.nombre_proyecto}
                      </p>
                    )}
                    {solicitud.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">
                        {solicitud.description}
                      </p>
                    )}
                    {solicitud.observaciones && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">
                        <span className="font-medium">Observaciones:</span> {solicitud.observaciones}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <EstadoBadge estado={solicitud.status} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t dark:border-gray-700 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Centro:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">
                      {solicitud.center?.name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Creada:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatDate(solicitud.created_at)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Por:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">
                      {creadorNombre}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}