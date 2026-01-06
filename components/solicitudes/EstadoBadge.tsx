import React from 'react';

export type EstadoSolicitud = 
  | 'nuevo'
  | 'recibido'
  | 'en_comite'
  | 'observado'
  | 'aprobado'
  | 'rechazado';

interface EstadoBadgeProps {
  estado: EstadoSolicitud;
  className?: string;
}

const estadoConfig: Record<EstadoSolicitud, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  nuevo: {
    label: 'Nuevo',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: '🆕'
  },
  recibido: {
    label: 'Recibido',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    icon: '📥'
  },
  en_comite: {
    label: 'En Comité',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: '👥'
  },
  observado: {
    label: 'Observado',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: '📝'
  },
  aprobado: {
    label: 'Aprobado',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: '✅'
  },
  rechazado: {
    label: 'Rechazado',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: '❌'
  }
};

export default function EstadoBadge({ estado, className = '' }: EstadoBadgeProps) {
  const config = estadoConfig[estado];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color} ${className}`}
    >
      <span className="text-base">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

// Componente para mostrar el estado con descripción adicional
export function EstadoBadgeDetailed({ estado, className = '' }: EstadoBadgeProps) {
  const config = estadoConfig[estado];
  
  const descripcion: Record<EstadoSolicitud, string> = {
    nuevo: 'Pendiente de revisión por el director',
    recibido: 'Recibida por el director del centro',
    en_comite: 'En evaluación por el comité',
    observado: 'Requiere correcciones',
    aprobado: 'Solicitud aprobada',
    rechazado: 'Solicitud rechazada'
  };

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <EstadoBadge estado={estado} />
      <p className="text-sm text-gray-600 mt-0.5">{descripcion[estado]}</p>
    </div>
  );
}