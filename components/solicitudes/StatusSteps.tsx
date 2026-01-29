'use client';

import { Check, X, Clock, FileText, Users, CheckCircle } from 'lucide-react';

interface HistorialEntry {
  estado_anterior: string | null;
  estado_nuevo: string;
  created_at: string;
}

interface StatusStepsProps {
  currentStatus: string;
  historial?: HistorialEntry[];
  compact?: boolean;
}

const BASE_STATUS_FLOW = [
  {
    key: 'nuevo',
    label: 'Solicitud Creada',
    description: 'Tu solicitud ha sido creada',
    icon: FileText
  },
  {
    key: 'recibido',
    label: 'Recibida por Centro',
    description: 'El centro ha recibido tu solicitud',
    icon: Check
  },
  {
    key: 'en_comite',
    label: 'En Comité',
    description: 'En proceso de aprobación',
    icon: Users
  },
  {
    key: 'final',
    label: 'Estado Final',
    description: 'Solicitud finalizada',
    icon: CheckCircle
  }
];

export default function StatusSteps({ currentStatus, historial = [], compact = false }: StatusStepsProps) {
  const isRejectedOrCancelled = ['rechazado', 'cancelado'].includes(currentStatus);
  
  // Determinar el último estado válido antes del rechazo/cancelación
  const getLastValidState = (): string => {
    if (!isRejectedOrCancelled || !historial || historial.length === 0) {
      return currentStatus;
    }
    
    // Buscar el último estado antes de rechazado/cancelado
    const validStates = ['nuevo', 'recibido', 'en_comite'];
    for (let i = historial.length - 1; i >= 0; i--) {
      if (validStates.includes(historial[i].estado_nuevo)) {
        return historial[i].estado_nuevo;
      }
    }
    
    // Si no encontramos ninguno, asumir que al menos fue creado
    return 'nuevo';
  };
  
  const lastValidState = getLastValidState();
  
  // Construir el flujo de estados dinámicamente
  // Si está rechazado/cancelado, insertar un paso adicional después del último estado válido
  const STATUS_FLOW = isRejectedOrCancelled
    ? (() => {
        const lastStateIndex = BASE_STATUS_FLOW.findIndex(s => s.key === lastValidState);
        const flow = [...BASE_STATUS_FLOW];
        
        // Insertar paso de rechazo/cancelación después del último estado válido
        flow.splice(lastStateIndex + 1, 0, {
          key: currentStatus,
          label: currentStatus === 'rechazado' ? 'Rechazada' : 'Cancelada',
          description: currentStatus === 'rechazado'
            ? 'Tu solicitud fue rechazada'
            : 'Tu solicitud fue cancelada',
          icon: X
        });
        
        return flow;
      })()
    : BASE_STATUS_FLOW;
  
  // Determinar el índice del paso actual
  const currentStepIndex = (() => {
    if (isRejectedOrCancelled) {
      // Encontrar el índice del paso de rechazo/cancelación en el flujo dinámico
      return STATUS_FLOW.findIndex(s => s.key === currentStatus);
    }
    
    // Para estados normales
    return STATUS_FLOW.findIndex(s => s.key === currentStatus);
  })();
  
  const isFinalStatus = ['aprobado', 'rechazado', 'cancelado'].includes(currentStatus);

  // Determinar el color del estado final
  const getFinalStatusColor = () => {
    if (currentStatus === 'aprobado') return 'green';
    if (currentStatus === 'rechazado') return 'red';
    if (currentStatus === 'cancelado') return 'gray';
    return 'blue';
  };

  const getFinalStatusIcon = () => {
    if (currentStatus === 'aprobado') return Check;
    if (currentStatus === 'rechazado') return X;
    if (currentStatus === 'cancelado') return X;
    return Clock;
  };

  const getFinalStatusLabel = () => {
    if (currentStatus === 'aprobado') return 'Aprobada';
    if (currentStatus === 'rechazado') return 'Rechazada';
    if (currentStatus === 'cancelado') return 'Cancelada';
    return 'Pendiente';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${compact ? 'p-4' : 'p-6'}`}>
      {!compact && (
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Seguimiento de Solicitud
        </h2>
      )}

      <div className="relative">
        {/* Línea de progreso */}
        <div className={`absolute ${compact ? 'top-3' : 'top-5'} left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700`}
             style={{ left: compact ? '1rem' : '2rem', right: compact ? '1rem' : '2rem' }} />
        <div
          className={`absolute ${compact ? 'top-3' : 'top-5'} left-0 h-0.5 bg-blue-600 dark:bg-blue-500 transition-all duration-500`}
          style={{
            left: compact ? '1rem' : '2rem',
            width: `calc(${(currentStepIndex / (STATUS_FLOW.length - 1)) * 100}% - ${compact ? '1rem' : '2rem'})`
          }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {STATUS_FLOW.map((step, index) => {
            // Los pasos completados son los anteriores al actual
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            // Si es rechazado/cancelado, el paso actual muestra error, los anteriores éxito
            const isFailedAtThisStep = isRejectedOrCancelled && isCurrent;
            
            const Icon = isFailedAtThisStep
              ? X
              : isCompleted
                ? Check
              : index === 3 && isFinalStatus && currentStatus === 'aprobado'
                ? Check
                : step.icon;
            
            const finalColor = getFinalStatusColor();

            // Para el último step, usar el estado final si aplica (solo para aprobado)
            const stepLabel = index === 3 && currentStatus === 'aprobado' ? getFinalStatusLabel() : step.label;
            const stepDescription = index === 3 && currentStatus === 'aprobado'
              ? `Tu solicitud ha sido ${getFinalStatusLabel().toLowerCase()}`
              : step.description;

            return (
              <div key={step.key} className="flex flex-col items-center relative" style={{ flex: 1 }}>
                {/* Círculo del step */}
                <div
                  className={`
                    ${compact ? 'w-6 h-6' : 'w-10 h-10'} rounded-full flex items-center justify-center z-10 transition-all duration-300
                    ${isCompleted
                      ? 'bg-blue-600 dark:bg-blue-500 text-white'
                      : isFailedAtThisStep
                        ? 'bg-red-600 dark:bg-red-500 text-white ring-4 ring-red-100 dark:ring-red-900/30'
                      : isCurrent && index === 3 && currentStatus === 'aprobado'
                        ? 'bg-green-600 dark:bg-green-500 text-white ring-4 ring-green-100 dark:ring-green-900/30'
                      : isCurrent
                        ? 'bg-blue-600 dark:bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-900/30'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }
                  `}
                >
                  <Icon className={compact ? 'w-3 h-3' : 'w-5 h-5'} />
                </div>

                {/* Label y descripción */}
                {!compact && (
                  <div className="mt-3 text-center max-w-[120px]">
                    <p className={`text-sm font-medium ${
                      isCompleted || isCurrent
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {stepLabel}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {stepDescription}
                    </p>
                  </div>
                )}
                
                {compact && (
                  <div className="mt-1 text-center">
                    <p className={`text-xs font-medium ${
                      isCompleted || isCurrent
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {stepLabel}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mensaje adicional según el estado */}
      {!compact && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        {currentStatus === 'nuevo' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Siguiente paso:</strong> Tu solicitud será recibida y revisada por el centro correspondiente.
            </p>
          </div>
        )}
        {currentStatus === 'recibido' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Siguiente paso:</strong> El centro enviará tu solicitud al comité para su evaluación.
            </p>
          </div>
        )}
        {currentStatus === 'en_comite' && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>En proceso:</strong> Tu solicitud está siendo evaluada por el comité. Recibirás una notificación cuando haya una decisión.
            </p>
          </div>
        )}
        {currentStatus === 'aprobado' && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>¡Felicitaciones!</strong> Tu solicitud ha sido aprobada. El centro se pondrá en contacto contigo para los siguientes pasos.
            </p>
          </div>
        )}
        {currentStatus === 'rechazado' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Solicitud rechazada:</strong> Lamentablemente tu solicitud no fue aprobada. Revisa las observaciones para más detalles.
            </p>
          </div>
        )}
        {currentStatus === 'cancelado' && (
          <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-800 dark:text-gray-200">
              <strong>Solicitud cancelada:</strong> Esta solicitud ha sido cancelada.
            </p>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
