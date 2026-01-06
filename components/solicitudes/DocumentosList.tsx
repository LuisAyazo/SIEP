'use client';

import React, { useState } from 'react';
import { getSignedUrl } from '@/lib/supabase/storage';

interface Documento {
  nombre: string;
  tipo: string;
  path: string;
  size?: number;
  uploadedAt?: string;
  requerido?: boolean;
}

interface DocumentosListProps {
  documentos: Documento[];
  solicitudId: string;
  className?: string;
  showActions?: boolean;
}

export default function DocumentosList({ 
  documentos, 
  solicitudId,
  className = '',
  showActions = true 
}: DocumentosListProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (documento: Documento) => {
    try {
      setDownloading(documento.path);
      
      // Obtener URL firmada
      const url = await getSignedUrl(documento.path, 3600); // 1 hora
      
      if (!url) {
        throw new Error('No se pudo obtener la URL del documento');
      }

      // Descargar archivo
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Crear link de descarga
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = documento.nombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error descargando documento:', error);
      alert('Error al descargar el documento');
    } finally {
      setDownloading(null);
    }
  };

  const handlePreview = async (documento: Documento) => {
    try {
      // Obtener URL firmada
      const url = await getSignedUrl(documento.path, 3600);
      
      if (!url) {
        throw new Error('No se pudo obtener la URL del documento');
      }

      // Abrir en nueva pestaña
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error previsualizando documento:', error);
      alert('Error al previsualizar el documento');
    }
  };

  const getIconForType = (tipo: string) => {
    const lowerTipo = tipo.toLowerCase();
    
    if (lowerTipo.includes('excel') || lowerTipo.includes('xlsx') || lowerTipo.includes('xls')) {
      return '📊';
    }
    if (lowerTipo.includes('pdf')) {
      return '📄';
    }
    if (lowerTipo.includes('word') || lowerTipo.includes('doc')) {
      return '📝';
    }
    if (lowerTipo.includes('imagen') || lowerTipo.includes('image')) {
      return '🖼️';
    }
    return '📎';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Tamaño desconocido';
    
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }
    
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (documentos.length === 0) {
    return (
      <div className={`bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500 text-sm">No hay documentos adjuntos</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {documentos.map((documento, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between gap-4">
            {/* Información del documento */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-3xl flex-shrink-0">
                {getIconForType(documento.tipo)}
              </span>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {documento.nombre}
                  </h4>
                  {documento.requerido && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Requerido
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="capitalize">{documento.tipo}</span>
                  {documento.size && (
                    <>
                      <span>•</span>
                      <span>{formatFileSize(documento.size)}</span>
                    </>
                  )}
                  {documento.uploadedAt && (
                    <>
                      <span>•</span>
                      <span>{formatDate(documento.uploadedAt)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones */}
            {showActions && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handlePreview(documento)}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Previsualizar"
                >
                  👁️ Ver
                </button>
                
                <button
                  onClick={() => handleDownload(documento)}
                  disabled={downloading === documento.path}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Descargar"
                >
                  {downloading === documento.path ? (
                    <span className="flex items-center gap-1">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>...</span>
                    </span>
                  ) : (
                    '⬇️ Descargar'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente simplificado para mostrar solo nombres
export function DocumentosListSimple({ documentos, className = '' }: { documentos: Documento[], className?: string }) {
  if (documentos.length === 0) {
    return <p className="text-sm text-gray-500">Sin documentos</p>;
  }

  return (
    <ul className={`space-y-1 ${className}`}>
      {documentos.map((doc, index) => (
        <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
          <span>{getIconForType(doc.tipo)}</span>
          <span className="truncate">{doc.nombre}</span>
          {doc.requerido && (
            <span className="text-xs text-red-600">*</span>
          )}
        </li>
      ))}
    </ul>
  );
}

// Helper function para el icono (exportada para uso en otros componentes)
function getIconForType(tipo: string) {
  const lowerTipo = tipo.toLowerCase();
  
  if (lowerTipo.includes('excel') || lowerTipo.includes('xlsx') || lowerTipo.includes('xls')) {
    return '📊';
  }
  if (lowerTipo.includes('pdf')) {
    return '📄';
  }
  if (lowerTipo.includes('word') || lowerTipo.includes('doc')) {
    return '📝';
  }
  if (lowerTipo.includes('imagen') || lowerTipo.includes('image')) {
    return '🖼️';
  }
  return '📎';
}