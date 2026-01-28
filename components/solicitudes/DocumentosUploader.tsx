'use client';

import { TipoSolicitud } from './TipoSolicitudSelector';

interface DocumentoRequerido {
  nombre: string;
  requerido: boolean;
  descripcion: string;
}

interface DocumentosUploaderProps {
  tipoSolicitud: TipoSolicitud;
  documentosAdjuntos: Record<string, File | null>;
  onFileChange: (documentoNombre: string, file: File | null) => void;
}

export function getDocumentosRequeridos(tipo: TipoSolicitud): DocumentoRequerido[] {
  const baseDocumentos: DocumentoRequerido[] = [
    {
      nombre: 'formato_003',
      requerido: true,
      descripcion: 'Formato 003 (Siempre requerido)'
    }
  ];

  switch (tipo) {
    case 'diplomado_proyeccion_social':
      return baseDocumentos;
    
    case 'diplomado_extension':
      return [
        ...baseDocumentos,
        {
          nombre: 'solicitud_coordinadores',
          requerido: false,
          descripcion: 'Solicitud de Designación de Coordinadores (Opcional)'
        },
        {
          nombre: 'disminucion_gasto',
          requerido: false,
          descripcion: 'Disminución del Gasto Administrativo (Opcional)'
        }
      ];
    
    case 'contrato':
      return [
        ...baseDocumentos,
        {
          nombre: 'contrato',
          requerido: true,
          descripcion: 'Contrato (Requerido)'
        },
        {
          nombre: 'solicitud_coordinadores',
          requerido: false,
          descripcion: 'Solicitud de Designación de Coordinadores (Opcional)'
        },
        {
          nombre: 'disminucion_gasto',
          requerido: false,
          descripcion: 'Disminución del Gasto Administrativo (Opcional)'
        }
      ];
    
    case 'convenio':
      return [
        ...baseDocumentos,
        {
          nombre: 'convenio',
          requerido: true,
          descripcion: 'Convenio (Requerido)'
        },
        {
          nombre: 'solicitud_coordinadores',
          requerido: false,
          descripcion: 'Solicitud de Designación de Coordinadores (Opcional)'
        },
        {
          nombre: 'disminucion_gasto',
          requerido: false,
          descripcion: 'Disminución del Gasto Administrativo (Opcional)'
        }
      ];
    
    default:
      return baseDocumentos;
  }
}

export default function DocumentosUploader({ 
  tipoSolicitud, 
  documentosAdjuntos, 
  onFileChange 
}: DocumentosUploaderProps) {
  const shouldShowFichaTecnica = tipoSolicitud !== 'diplomado_proyeccion_social';
  const documentos = getDocumentosRequeridos(tipoSolicitud);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Documentos Requeridos</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Adjunte los documentos necesarios para su solicitud de tipo:{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            {tipoSolicitud === 'diplomado_proyeccion_social' && 'Diplomado - Proyección Social'}
            {tipoSolicitud === 'diplomado_extension' && 'Diplomado - Extensión'}
            {tipoSolicitud === 'contrato' && 'Contrato'}
            {tipoSolicitud === 'convenio' && 'Convenio'}
          </span>
        </p>
      </div>

      <div className="space-y-4">
        {documentos.map((doc) => (
          <div key={doc.nombre} className="border border-gray-300 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  {doc.descripcion}
                  {doc.requerido && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
                </label>
                {!doc.requerido && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Opcional</p>
                )}
              </div>
              {documentosAdjuntos[doc.nombre] && (
                <span className="text-green-600 dark:text-green-400 text-sm font-medium">✓ Adjuntado</span>
              )}
            </div>
            
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                onFileChange(doc.nombre, file);
              }}
              className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/50 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/70 transition-colors"
            />
            
            {documentosAdjuntos[doc.nombre] && (
              <div className="mt-2 flex items-center justify-between bg-white dark:bg-slate-900/50 p-3 rounded border border-gray-200 dark:border-slate-600">
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                  {documentosAdjuntos[doc.nombre]?.name}
                </span>
                <button
                  type="button"
                  onClick={() => onFileChange(doc.nombre, null)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium transition-colors"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!shouldShowFichaTecnica && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-400 p-4 rounded">
          <p className="text-sm text-blue-800 dark:text-blue-100">
            ℹ️ <strong>Nota:</strong> Como seleccionó "Diplomado - Proyección Social",
            NO necesita completar la ficha técnica. Puede proceder directamente a confirmar su solicitud.
          </p>
        </div>
      )}
    </div>
  );
}