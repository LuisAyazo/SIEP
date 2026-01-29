'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseSession } from '@/components/providers/SessionProvider';
import { AVAILABLE_CENTERS, Center } from '@/components/providers/CenterContext';
import TipoSolicitudSelector, { TipoSolicitud } from '@/components/solicitudes/TipoSolicitudSelector';
import DocumentosUploader, { getDocumentosRequeridos } from '@/components/solicitudes/DocumentosUploader';
import ConfirmacionSolicitud from '@/components/solicitudes/ConfirmacionSolicitud';
import Image from 'next/image';
import { Building2 } from 'lucide-react';

export default function CreateSolicitudSinCentroPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useSupabaseSession();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [tipoSolicitud, setTipoSolicitud] = useState<TipoSolicitud | null>(null);
  const [documentosAdjuntos, setDocumentosAdjuntos] = useState<Record<string, File | null>>({});

  // Datos del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media' as 'baja' | 'media' | 'alta',
  });

  // Verificar autenticación
  useEffect(() => {
    if (!authLoading && !session) {
      router.replace('/login');
    }
  }, [session, authLoading, router]);

  const handleFileChange = (documentoNombre: string, file: File | null) => {
    setDocumentosAdjuntos(prev => ({
      ...prev,
      [documentoNombre]: file
    }));
  };

  const validateDocumentos = (): boolean => {
    if (!tipoSolicitud) return false;
    
    const documentosRequeridos = getDocumentosRequeridos(tipoSolicitud);
    const faltantes = documentosRequeridos
      .filter(doc => doc.requerido && !documentosAdjuntos[doc.nombre])
      .map(doc => doc.descripcion);
    
    if (faltantes.length > 0) {
      alert(`Faltan documentos requeridos:\n${faltantes.join('\n')}`);
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !selectedCenter) {
      alert('Por favor seleccione un centro');
      return;
    }
    
    if (step === 1 && !tipoSolicitud) {
      alert('Por favor seleccione un tipo de solicitud');
      return;
    }
    
    if (step === 2 && !formData.titulo.trim()) {
      alert('Por favor ingrese un título para la solicitud');
      return;
    }
    
    if (step === 3 && !validateDocumentos()) {
      return;
    }
    
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 0) {
      router.push('/');
    } else {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    try {
      // Crear FormData para enviar archivos
      const submitData = new FormData();
      
      console.log('📋 Iniciando creación de solicitud...');
      console.log('📄 Tipo de solicitud:', tipoSolicitud);
      console.log('🏢 Centro seleccionado:', selectedCenter);
      console.log('📎 Documentos adjuntos:', documentosAdjuntos);
      
      // Agregar datos básicos
      if (tipoSolicitud) {
        submitData.append('tipo_solicitud', tipoSolicitud);
      }
      
      submitData.append('titulo', formData.titulo);
      submitData.append('descripcion', formData.descripcion);
      submitData.append('prioridad', formData.prioridad);
      
      // Agregar el centro seleccionado
      if (selectedCenter) {
        submitData.append('center_id', selectedCenter.id);
      }
      
      // Agregar documentos adjuntos
      let documentosCount = 0;
      Object.entries(documentosAdjuntos).forEach(([key, file]) => {
        if (file) {
          console.log(`📎 Agregando documento ${key}:`, file.name, file.size, 'bytes');
          submitData.append(key, file);
          documentosCount++;
        }
      });
      
      console.log(`✅ Total de documentos a enviar: ${documentosCount}`);
      
      // Enviar a la API
      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        body: submitData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al crear solicitud');
      }
      
      // Mostrar mensaje de éxito
      alert('✅ Solicitud creada exitosamente');
      
      // Redireccionar a la lista de solicitudes
      router.push('/solicitudes');
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      alert(`❌ Error al crear la solicitud: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Nueva Solicitud</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Complete el formulario para crear una nueva solicitud</p>
          
          {/* Mostrar centro seleccionado */}
          {selectedCenter && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">Centro seleccionado:</span>
                <span className="ml-2 text-sm text-blue-700 dark:text-blue-300">{selectedCenter.name}</span>
              </div>
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="ml-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
                >
                  Cambiar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Indicador de Pasos */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex-1 ${step >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-400'}`}>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 0 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-slate-600 text-gray-600 dark:text-gray-300'}`}>1</div>
                <span className="ml-2 font-medium text-sm">Centro</span>
              </div>
            </div>
            <div className={`flex-1 ${step >= 1 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-400'}`}>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-slate-600 text-gray-600 dark:text-gray-300'}`}>2</div>
                <span className="ml-2 font-medium text-sm">Tipo</span>
              </div>
            </div>
            <div className={`flex-1 ${step >= 2 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-400'}`}>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-slate-600 text-gray-600 dark:text-gray-300'}`}>3</div>
                <span className="ml-2 font-medium text-sm">Info Básica</span>
              </div>
            </div>
            <div className={`flex-1 ${step >= 3 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-400'}`}>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-slate-600 text-gray-600 dark:text-gray-300'}`}>4</div>
                <span className="ml-2 font-medium text-sm">Documentos</span>
              </div>
            </div>
            <div className={`flex-1 ${step >= 4 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-400'}`}>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-slate-600 text-gray-600 dark:text-gray-300'}`}>5</div>
                <span className="ml-2 font-medium text-sm">Confirmar</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* PASO 0: Seleccionar Centro */}
          {step === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Seleccione el Centro
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                Elija el centro al que desea dirigir su solicitud
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {AVAILABLE_CENTERS.map((center) => (
                  <button
                    key={center.id}
                    type="button"
                    onClick={() => {
                      setSelectedCenter(center);
                      setStep(1);
                    }}
                    className={`p-6 rounded-lg border-2 transition-all hover:shadow-lg ${
                      selectedCenter?.id === center.id
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <Building2 className={`w-12 h-12 mb-3 ${
                        selectedCenter?.id === center.id
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`} />
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {center.name}
                      </h4>
                      {center.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {center.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                >
                  ← Volver
                </button>
              </div>
            </div>
          )}

          {/* PASO 1: Tipo de Solicitud */}
          {step === 1 && (
            <TipoSolicitudSelector
              value={tipoSolicitud}
              onChange={(tipo) => {
                setTipoSolicitud(tipo);
                setStep(2);
              }}
            />
          )}

          {/* PASO 2: Información Básica */}
          {step === 2 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">Título de la Solicitud *</label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Ej: Solicitud de Ficha Técnica para Proyecto X"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 min-h-[100px] bg-white dark:bg-slate-700/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Descripción breve de la solicitud"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">Prioridad</label>
                <select
                  value={formData.prioridad}
                  onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-gray-100"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                >
                  ← Atrás
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Adjuntar Documentos */}
          {step === 3 && tipoSolicitud && (
            <>
              <DocumentosUploader
                tipoSolicitud={tipoSolicitud}
                documentosAdjuntos={documentosAdjuntos}
                onFileChange={handleFileChange}
              />
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                >
                  ← Atrás
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </>
          )}

          {/* PASO 4: Confirmación */}
          {step === 4 && tipoSolicitud && (
            <>
              <ConfirmacionSolicitud
                tipoSolicitud={tipoSolicitud}
                titulo={formData.titulo}
                descripcion={formData.descripcion}
                prioridad={formData.prioridad}
                documentosAdjuntos={documentosAdjuntos}
                metodoFichaTecnica={null}
                excelFile={null}
                excelValidationResult={null}
                selectedCenter={selectedCenter}
              />
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                >
                  ← Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 dark:bg-green-600 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : '✓ Crear Solicitud'}
                </button>
              </div>
            </>
          )}
        </form>
    </div>
  );
}
