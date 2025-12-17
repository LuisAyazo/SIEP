'use client';

import { TipoSolicitud } from './TipoSolicitudSelector';
import { getDocumentosRequeridos } from './DocumentosUploader';

interface ConfirmacionSolicitudProps {
  tipoSolicitud: TipoSolicitud;
  titulo: string;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta';
  documentosAdjuntos: Record<string, File | null>;
  metodoFichaTecnica?: 'importar' | 'formulario' | null;
  excelFile?: File | null;
  excelValidationResult?: any;
}

export default function ConfirmacionSolicitud({
  tipoSolicitud,
  titulo,
  descripcion,
  prioridad,
  documentosAdjuntos,
  metodoFichaTecnica,
  excelFile,
  excelValidationResult
}: ConfirmacionSolicitudProps) {
  const documentos = getDocumentosRequeridos(tipoSolicitud);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmar Solicitud</h2>
        <p className="text-gray-600">Revise la información antes de enviar</p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Tipo de Solicitud</h3>
          <p className="text-gray-700">
            {tipoSolicitud === 'diplomado_proyeccion_social' && '📚 Diplomado - Proyección Social'}
            {tipoSolicitud === 'diplomado_extension' && '🎓 Diplomado - Extensión'}
            {tipoSolicitud === 'contrato' && '📄 Contrato'}
            {tipoSolicitud === 'convenio' && '🤝 Convenio'}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Información Básica</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Título:</span> {titulo}
            </p>
            {descripcion && (
              <p className="text-sm">
                <span className="font-medium">Descripción:</span> {descripcion}
              </p>
            )}
            <p className="text-sm">
              <span className="font-medium">Prioridad:</span>{' '}
              <span className={`px-2 py-1 rounded text-xs ${
                prioridad === 'alta' ? 'bg-red-100 text-red-800' :
                prioridad === 'media' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {prioridad.toUpperCase()}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Documentos Adjuntos</h3>
          <ul className="space-y-2">
            {documentos.map((doc) => {
              const file = documentosAdjuntos[doc.nombre];
              return (
                <li key={doc.nombre} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {doc.descripcion}
                    {doc.requerido && <span className="text-red-600 ml-1">*</span>}
                  </span>
                  {file ? (
                    <span className="text-green-600 flex items-center gap-2">
                      <span>✓</span>
                      <span className="text-xs text-gray-600">{file.name}</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">No adjuntado</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {tipoSolicitud !== 'diplomado_proyeccion_social' && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">📋 Ficha Técnica</p>
            {metodoFichaTecnica === 'importar' && excelFile ? (
              <div className="space-y-2">
                <p className="text-sm text-blue-800">
                  <strong>Método:</strong> Importar desde Excel
                </p>
                <div className="flex items-center gap-2 bg-white p-2 rounded border border-blue-200">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-900">{excelFile.name}</p>
                    <p className="text-xs text-blue-700">{(excelFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  {excelValidationResult?.valid && (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {excelValidationResult?.data && (
                  <div className="text-xs text-blue-700 bg-white p-2 rounded border border-blue-200">
                    <p><strong>Datos extraídos:</strong></p>
                    <p>• Ficha Técnica: {Object.keys(excelValidationResult.data.fichatecnica || {}).length} campos</p>
                    <p>• Formato P&P: {Object.keys(excelValidationResult.data.formatopp || {}).length} campos</p>
                  </div>
                )}
              </div>
            ) : metodoFichaTecnica === 'formulario' ? (
              <p className="text-sm text-blue-800">
                <strong>Método:</strong> Formulario completado manualmente (se generará Excel automáticamente)
              </p>
            ) : (
              <p className="text-sm text-blue-800">
                ℹ️ <strong>Nota:</strong> La ficha técnica se incluirá según el método que seleccionó.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}