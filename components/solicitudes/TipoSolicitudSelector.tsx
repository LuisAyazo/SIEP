'use client';

export type TipoSolicitud = 
  | 'diplomado_proyeccion_social'
  | 'diplomado_extension'
  | 'contrato'
  | 'convenio';

interface TipoSolicitudSelectorProps {
  value: TipoSolicitud | null;
  onChange: (tipo: TipoSolicitud) => void;
}

export default function TipoSolicitudSelector({ value, onChange }: TipoSolicitudSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tipo de Solicitud</h2>
        <p className="text-gray-600">Seleccione el tipo de solicitud que desea crear</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onChange('diplomado_proyeccion_social')}
          className={`p-6 border-2 rounded-lg text-left transition-all ${
            value === 'diplomado_proyeccion_social'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📚 Diplomado - Proyección Social
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Diplomado gratuito de proyección social
          </p>
          <div className="text-xs text-gray-500">
            <p className="font-semibold mb-1">Documentos requeridos:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Formato 003</li>
            </ul>
            <p className="mt-2 text-blue-600 font-medium">
              ⚠️ NO requiere ficha técnica
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange('diplomado_extension')}
          className={`p-6 border-2 rounded-lg text-left transition-all ${
            value === 'diplomado_extension'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🎓 Diplomado - Extensión
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Diplomado de extensión con costo
          </p>
          <div className="text-xs text-gray-500">
            <p className="font-semibold mb-1">Documentos requeridos:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Formato 003</li>
              <li>Ficha técnica (importar Excel o llenar formulario)</li>
              <li className="text-gray-400">Solicitud coordinadores (opcional)</li>
              <li className="text-gray-400">Disminución gasto (opcional)</li>
            </ul>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange('contrato')}
          className={`p-6 border-2 rounded-lg text-left transition-all ${
            value === 'contrato'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📄 Contrato
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Solicitud con contrato adjunto
          </p>
          <div className="text-xs text-gray-500">
            <p className="font-semibold mb-1">Documentos requeridos:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Formato 003</li>
              <li>Contrato</li>
              <li>Ficha técnica (importar Excel o llenar formulario)</li>
              <li className="text-gray-400">Solicitud coordinadores (opcional)</li>
              <li className="text-gray-400">Disminución gasto (opcional)</li>
            </ul>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange('convenio')}
          className={`p-6 border-2 rounded-lg text-left transition-all ${
            value === 'convenio'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🤝 Convenio
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Solicitud con convenio adjunto
          </p>
          <div className="text-xs text-gray-500">
            <p className="font-semibold mb-1">Documentos requeridos:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Formato 003</li>
              <li>Convenio</li>
              <li>Ficha técnica (importar Excel o llenar formulario)</li>
              <li className="text-gray-400">Solicitud coordinadores (opcional)</li>
              <li className="text-gray-400">Disminución gasto (opcional)</li>
            </ul>
          </div>
        </button>
      </div>
    </div>
  );
}