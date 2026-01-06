'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useCenterContext } from '@/components/providers/CenterContext';
import EstadoBadge, { EstadoSolicitud } from '@/components/solicitudes/EstadoBadge';
import { Plus, Search, Filter, FileText } from 'lucide-react';

interface Solicitud {
  id: string;
  tipo: string;
  metodo_ficha_tecnica: string;
  estado: EstadoSolicitud;
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
}

export default function SolicitudesPage({
  params
}: {
  params: Promise<{ centerSlug: string }>
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { currentCenter } = useCenterContext();
  
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('all');
  const [selectedTipo, setSelectedTipo] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentCenter) {
      loadSolicitudes();
    }
  }, [currentCenter, selectedEstado, selectedTipo]);

  async function loadSolicitudes() {
    if (!currentCenter) return;
    
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

  // Filtrar solicitudes por búsqueda
  const filteredSolicitudes = solicitudes.filter(solicitud => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const funcionarioNombre = solicitud.funcionario?.raw_user_meta_data?.full_name || 
                              solicitud.funcionario?.email || '';
    
    return (
      solicitud.id.toLowerCase().includes(searchLower) ||
      funcionarioNombre.toLowerCase().includes(searchLower) ||
      getTipoLabel(solicitud.tipo).toLowerCase().includes(searchLower)
    );
  });

  // Componente de Skeleton Loader
  const SolicitudSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-5 bg-gray-200 rounded w-24"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-24"></div>
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
            <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
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
          <p className="text-gray-600 mt-1">
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

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por ID, funcionario o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filtro por Estado */}
          <div className="w-full md:w-48">
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="mt-3 text-sm text-gray-600">
          {filteredSolicitudes.length} solicitud{filteredSolicitudes.length !== 1 ? 'es' : ''} encontrada{filteredSolicitudes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Lista de Solicitudes */}
      {filteredSolicitudes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {solicitudes.length === 0 ? 'No hay solicitudes' : 'No se encontraron resultados'}
          </h3>
          <p className="text-gray-600 mb-4">
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
            const funcionarioNombre = solicitud.funcionario?.raw_user_meta_data?.full_name || 
                                     solicitud.funcionario?.email || 
                                     'Desconocido';

            return (
              <div
                key={solicitud.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                onClick={() => router.push(`/center/${resolvedParams.centerSlug}/solicitudes/${solicitud.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        #{solicitud.id.slice(0, 8)}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getTipoLabel(solicitud.tipo)}
                      </h3>
                    </div>
                    {solicitud.observaciones && (
                      <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                        <span className="font-medium">Observaciones:</span> {solicitud.observaciones}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <EstadoBadge estado={solicitud.estado} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Método:</span>{' '}
                    <span className="text-gray-600 capitalize">
                      {solicitud.metodo_ficha_tecnica}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Creada:</span>{' '}
                    <span className="text-gray-600">
                      {formatDate(solicitud.created_at)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Por:</span>{' '}
                    <span className="text-gray-600">
                      {funcionarioNombre}
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