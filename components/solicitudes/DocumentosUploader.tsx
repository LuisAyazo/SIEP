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
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Documentos Requeridos</h2>
        <p className="text-gray-600">
          Adjunte los documentos necesarios para su solicitud de tipo:{' '}
          <span className="font-semibold">
            {tipoSolicitud === 'diplomado_proyeccion_social' && 'Diplomado - Proyección Social'}
            {tipoSolicitud === 'diplomado_extension' && 'Diplomado - Extensión'}
            {tipoSolicitud === 'contrato' && 'Contrato'}
            {tipoSolicitud === 'convenio' && 'Convenio'}
          </span>
        </p>
      </div>

      <div className="space-y-4">
        {documentos.map((doc) => (
          <div key={doc.nombre} className="border border-gray-300 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-900">
                  {doc.descripcion}
                  {doc.requerido && <span className="text-red-600 ml-1">*</span>}
                </label>
                {!doc.requerido && (
                  <p className="text-xs text-gray-500 mt-1">Opcional</p>
                )}
              </div>
              {documentosAdjuntos[doc.nombre] && (
                <span className="text-green-600 text-sm">✓ Adjuntado</span>
              )}
            </div>
            
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                onFileChange(doc.nombre, file);
              }}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            
            {documentosAdjuntos[doc.nombre] && (
              <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm text-gray-700">
                  {documentosAdjuntos[doc.nombre]?.name}
                </span>
                <button
                  type="button"
                  onClick={() => onFileChange(doc.nombre, null)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!shouldShowFichaTecnica && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <p className="text-sm text-blue-800">
            ℹ️ <strong>Nota:</strong> Como seleccionó "Diplomado - Proyección Social", 
            NO necesita completar la ficha técnica. Puede proceder directamente a confirmar su solicitud.
          </p>
        </div>
      )}
    </div>
  );
}