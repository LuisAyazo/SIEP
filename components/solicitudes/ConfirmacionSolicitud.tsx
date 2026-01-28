'use client';

import { TipoSolicitud } from './TipoSolicitudSelector';
import { getDocumentosRequeridos } from './DocumentosUploader';
import { Center } from '../providers/CenterContext';

interface ConfirmacionSolicitudProps {
  tipoSolicitud: TipoSolicitud;
  titulo: string;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta';
  documentosAdjuntos: Record<string, File | null>;
  metodoFichaTecnica?: 'importar' | 'formulario' | null;
  excelFile?: File | null;
  excelValidationResult?: any;
  selectedCenter?: Center | null;
}

export default function ConfirmacionSolicitud({
  tipoSolicitud,
  titulo,
  descripcion,
  prioridad,
  documentosAdjuntos,
  metodoFichaTecnica,
  excelFile,
  excelValidationResult,
  selectedCenter
}: ConfirmacionSolicitudProps) {
  const documentos = getDocumentosRequeridos(tipoSolicitud);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Confirmar Solicitud</h2>
        <p className="text-gray-600 dark:text-gray-300">Revise la información antes de enviar</p>
      </div>

      <div className="space-y-4">
        {selectedCenter && (
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">🏢 Centro</h3>
            <p className="text-blue-700 dark:text-blue-300">{selectedCenter.name}</p>
            {selectedCenter.description && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">{selectedCenter.description}</p>
            )}
          </div>
        )}

        <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Tipo de Solicitud</h3>
          <p className="text-gray-700 dark:text-gray-200">
            {tipoSolicitud === 'diplomado_proyeccion_social' && '📚 Diplomado - Proyección Social'}
            {tipoSolicitud === 'diplomado_extension' && '🎓 Diplomado - Extensión'}
            {tipoSolicitud === 'contrato' && '📄 Contrato'}
            {tipoSolicitud === 'convenio' && '🤝 Convenio'}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Información Básica</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-200">
              <span className="font-medium">Título:</span> {titulo}
            </p>
            {descripcion && (
              <p className="text-sm text-gray-700 dark:text-gray-200">
                <span className="font-medium">Descripción:</span> {descripcion}
              </p>
            )}
            <p className="text-sm text-gray-700 dark:text-gray-200">
              <span className="font-medium">Prioridad:</span>{' '}
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                prioridad === 'alta' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                prioridad === 'media' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              }`}>
                {prioridad.toUpperCase()}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Documentos Adjuntos</h3>
          <ul className="space-y-2">
            {documentos.map((doc) => {
              const file = documentosAdjuntos[doc.nombre];
              return (
                <li key={doc.nombre} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-200">
                    {doc.descripcion}
                    {doc.requerido && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
                  </span>
                  {file ? (
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-2 font-medium">
                      <span>✓</span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">{file.name}</span>
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">No adjuntado</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {tipoSolicitud !== 'diplomado_proyeccion_social' && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-400 p-4 rounded">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">📋 Ficha Técnica</p>
            {metodoFichaTecnica === 'importar' && excelFile ? (
              <div className="space-y-2">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Método:</strong> Importar desde Excel
                </p>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900/50 p-2 rounded border border-blue-200 dark:border-blue-700">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-100">{excelFile.name}</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">{(excelFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  {excelValidationResult?.valid && (
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {excelValidationResult?.data && (
                  <div className="text-xs text-blue-700 dark:text-blue-200 bg-white dark:bg-slate-900/50 p-2 rounded border border-blue-200 dark:border-blue-700">
                    <p><strong>Datos extraídos:</strong></p>
                    <p>• Ficha Técnica: {Object.keys(excelValidationResult.data.fichatecnica || {}).length} campos</p>
                    <p>• Formato P&P: {Object.keys(excelValidationResult.data.formatopp || {}).length} campos</p>
                  </div>
                )}
              </div>
            ) : metodoFichaTecnica === 'formulario' ? (
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Método:</strong> Formulario completado manualmente (se generará Excel automáticamente)
              </p>
            ) : (
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ℹ️ <strong>Nota:</strong> La ficha técnica se incluirá según el método que seleccionó.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}