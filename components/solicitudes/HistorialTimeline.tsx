'use client';

import React, { useState, useEffect } from 'react';
import { EstadoSolicitud } from './EstadoBadge';

export interface HistorialItem {
  id: string;
  estado_anterior: EstadoSolicitud | null;
  estado_nuevo: EstadoSolicitud;
  user_name: string;
  user_role: string;
  comentario?: string;
  created_at: string;
  metadata?: {
    center_name?: string;
    assigned_to_center_name?: string;
    [key: string]: any;
  };
}

interface HistorialTimelineProps {
  historial?: HistorialItem[];
  solicitudId?: string;
  className?: string;
}

export default function HistorialTimeline({ historial: historialProp, solicitudId, className = '' }: HistorialTimelineProps) {
  const [historial, setHistorial] = useState<HistorialItem[]>(historialProp || []);
  const [loading, setLoading] = useState(!historialProp);

  useEffect(() => {
    if (!historialProp && solicitudId) {
      loadHistorial();
    }
  }, [solicitudId, historialProp]);

  async function loadHistorial() {
    try {
      const response = await fetch(`/api/solicitudes/${solicitudId}/historial`);
      const data = await response.json();
      
      if (response.ok && data.historial) {
        setHistorial(data.historial);
      } else {
        console.error('Error al cargar historial:', response.status, data);
        // En caso de error, establecer array vacío en lugar de fallar
        setHistorial([]);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
      // En caso de error, establecer array vacío en lugar de fallar
      setHistorial([]);
    } finally {
      setLoading(false);
    }
  }
  const getEstadoConfig = (estado: EstadoSolicitud) => {
    const config: Record<EstadoSolicitud, { color: string; icon: string; label: string }> = {
      nuevo: { color: 'bg-blue-500 dark:bg-blue-600', icon: '🆕', label: 'Nuevo' },
      recibido: { color: 'bg-cyan-500 dark:bg-cyan-500', icon: '📥', label: 'Recibido' },
      en_comite: { color: 'bg-purple-500 dark:bg-purple-600', icon: '👥', label: 'En Comité' },
      observado: { color: 'bg-yellow-500 dark:bg-yellow-600', icon: '📝', label: 'Observado' },
      aprobado: { color: 'bg-green-500 dark:bg-green-600', icon: '✅', label: 'Aprobado' },
      rechazado: { color: 'bg-red-500 dark:bg-red-600', icon: '❌', label: 'Rechazado' },
      cancelado: { color: 'bg-gray-500 dark:bg-gray-600', icon: '🚫', label: 'Cancelado' }
    };
    return config[estado];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAccionDescripcion = (item: HistorialItem) => {
    if (!item.estado_anterior) {
      const centerName = item.metadata?.center_name;
      return centerName ? `Solicitud creada en ${centerName}` : 'Solicitud creada';
    }

    // Para rechazos, mostrar "Rechazada por [rol]"
    if (item.estado_nuevo === 'rechazado') {
      return `Rechazada por ${item.user_role}`;
    }

    // Obtener nombres de centros del metadata
    const centerName = item.metadata?.center_name;
    const assignedToCenterName = item.metadata?.assigned_to_center_name;

    const key = `${item.estado_anterior}_${item.estado_nuevo}`;
    
    // Transiciones con información de centros
    if (key === 'nuevo_recibido') {
      return centerName ? `Recibida por ${centerName}` : 'Recibida por el director';
    }
    
    if (key === 'recibido_en_comite') {
      if (assignedToCenterName) {
        return `Enviada a comité de ${assignedToCenterName}`;
      }
      return 'Enviada a comité';
    }

    const transiciones: Record<string, string> = {
      'en_comite_aprobado': 'Aprobada por el comité',
      'en_comite_observado': 'Devuelta con observaciones',
      'observado_nuevo': 'Devuelta al funcionario para correcciones',
      'nuevo_cancelado': 'Cancelada por el creador',
      'recibido_cancelado': 'Cancelada por el creador',
      'en_comite_cancelado': 'Cancelada por el creador',
      'observado_cancelado': 'Cancelada por el creador'
    };

    return transiciones[key] || `Cambio de estado: ${item.estado_anterior} → ${item.estado_nuevo}`;
  };

  if (loading) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Cargando historial...</p>
      </div>
    );
  }

  if (!historial || historial.length === 0) {
    return (
      <div className={`bg-gray-50 dark:bg-slate-700 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No hay historial disponible</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        {/* Línea vertical */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

        {/* Items del historial */}
        <div className="space-y-6">
          {historial.map((item, index) => {
            const config = getEstadoConfig(item.estado_nuevo);
            const isLast = index === historial.length - 1;

            return (
              <div key={item.id} className="relative pl-12">
                {/* Punto en la línea */}
                <div className={`absolute left-0 w-8 h-8 rounded-full ${config.color} flex items-center justify-center text-white shadow-lg z-10`}>
                  <span className="text-sm">{config.icon}</span>
                </div>

                {/* Contenido */}
                <div className={`bg-white dark:bg-gray-800 rounded-lg border-2 ${isLast ? 'border-blue-300 dark:border-blue-600 shadow-md' : 'border-gray-200 dark:border-gray-700'} p-4`}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h4 className={`text-sm font-semibold ${item.estado_nuevo === 'rechazado' ? 'text-white dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                        {getAccionDescripcion(item)}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.estado_nuevo === 'rechazado'
                        ? 'bg-red-600 text-white'
                        : config.color.replace('bg-', 'bg-opacity-10 text-')
                    }`}>
                      {config.label}
                    </span>
                  </div>

                  {/* Usuario */}
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-medium">{item.user_name}</span>
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    <span className="capitalize">{item.user_role}</span>
                  </div>

                  {/* Comentario */}
                  {item.comentario && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                        "{item.comentario}"
                      </p>
                    </div>
                  )}

                  {/* Indicador de último item */}
                  {isLast && (
                    <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-900">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        📍 Estado actual
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Componente simplificado para mostrar solo el último cambio
export function UltimoCambio({ historial, className = '' }: HistorialTimelineProps) {
  if (!historial || historial.length === 0) {
    return null;
  }

  const ultimo = historial[historial.length - 1];
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      <span className="text-gray-400 dark:text-gray-500">Última actualización:</span>
      <span className="font-medium">{formatDate(ultimo.created_at)}</span>
      <span className="text-gray-400 dark:text-gray-500">por</span>
      <span className="font-medium">{ultimo.user_name}</span>
    </div>
  );
}