'use client';

import React from 'react';
import { EstadoSolicitud } from './EstadoBadge';

export interface HistorialItem {
  id: string;
  estado_anterior: EstadoSolicitud | null;
  estado_nuevo: EstadoSolicitud;
  user_name: string;
  user_role: string;
  comentario?: string;
  created_at: string;
}

interface HistorialTimelineProps {
  historial: HistorialItem[];
  className?: string;
}

export default function HistorialTimeline({ historial, className = '' }: HistorialTimelineProps) {
  const getEstadoConfig = (estado: EstadoSolicitud) => {
    const config: Record<EstadoSolicitud, { color: string; icon: string; label: string }> = {
      nuevo: { color: 'bg-blue-500', icon: '🆕', label: 'Nuevo' },
      recibido: { color: 'bg-indigo-500', icon: '📥', label: 'Recibido' },
      en_comite: { color: 'bg-purple-500', icon: '👥', label: 'En Comité' },
      observado: { color: 'bg-yellow-500', icon: '📝', label: 'Observado' },
      aprobado: { color: 'bg-green-500', icon: '✅', label: 'Aprobado' },
      rechazado: { color: 'bg-red-500', icon: '❌', label: 'Rechazado' }
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
      return 'Solicitud creada';
    }

    const transiciones: Record<string, string> = {
      'nuevo_recibido': 'Recibida por el director',
      'recibido_en_comite': 'Enviada a comité',
      'en_comite_aprobado': 'Aprobada por el comité',
      'en_comite_rechazado': 'Rechazada por el comité',
      'en_comite_observado': 'Devuelta con observaciones',
      'observado_nuevo': 'Devuelta al funcionario para correcciones',
      'nuevo_rechazado': 'Rechazada por el director',
      'recibido_rechazado': 'Rechazada por el director'
    };

    const key = `${item.estado_anterior}_${item.estado_nuevo}`;
    return transiciones[key] || `Cambio de estado: ${item.estado_anterior} → ${item.estado_nuevo}`;
  };

  if (historial.length === 0) {
    return (
      <div className={`bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500 text-sm">No hay historial disponible</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de la Solicitud</h3>
      
      <div className="relative">
        {/* Línea vertical */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

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
                <div className={`bg-white rounded-lg border-2 ${isLast ? 'border-blue-300 shadow-md' : 'border-gray-200'} p-4`}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {getAccionDescripcion(item)}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color.replace('bg-', 'bg-opacity-10 text-')}`}>
                      {config.label}
                    </span>
                  </div>

                  {/* Usuario */}
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <span className="font-medium">{item.user_name}</span>
                    <span className="text-gray-400">•</span>
                    <span className="capitalize">{item.user_role}</span>
                  </div>

                  {/* Comentario */}
                  {item.comentario && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-700 italic">
                        "{item.comentario}"
                      </p>
                    </div>
                  )}

                  {/* Indicador de último item */}
                  {isLast && (
                    <div className="mt-3 pt-3 border-t border-blue-100">
                      <p className="text-xs text-blue-600 font-medium">
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
  if (historial.length === 0) {
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
    <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
      <span className="text-gray-400">Última actualización:</span>
      <span className="font-medium">{formatDate(ultimo.created_at)}</span>
      <span className="text-gray-400">por</span>
      <span className="font-medium">{ultimo.user_name}</span>
    </div>
  );
}