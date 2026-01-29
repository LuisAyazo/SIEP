'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseSession } from '@/components/providers/SessionProvider';
import { ArrowLeft, Upload, X } from 'lucide-react';
import Image from 'next/image';

interface Solicitud {
  id: string;
  tipo_solicitud: string;
  status: string;
  nombre_proyecto?: string;
  title?: string;
  description?: string;
  priority?: string;
  created_at: string;
}

export default function EditarSolicitudPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { session, loading: authLoading } = useSupabaseSession();
  
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Datos del formulario
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<'baja' | 'media' | 'alta'>('media');
  const [documentos, setDocumentos] = useState<Record<string, File | null>>({});

  // Verificar autenticación
  useEffect(() => {
    if (!authLoading && !session) {
      router.replace('/login');
    }
  }, [session, authLoading, router]);

  useEffect(() => {
    if (session && resolvedParams.id) {
      loadSolicitud();
    }
  }, [session, resolvedParams.id]);

  async function loadSolicitud() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/solicitudes/${resolvedParams.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar solicitud');
      }

      setSolicitud(data.solicitud);
      setTitulo(data.solicitud.title || data.solicitud.nombre_proyecto || '');
      setDescripcion(data.solicitud.description || '');
      setPrioridad(data.solicitud.priority || 'media');
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (documentoNombre: string, file: File | null) => {
    setDocumentos(prev => ({
      ...prev,
      [documentoNombre]: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titulo.trim()) {
      alert('El título es requerido');
      return;
    }

    setSaving(true);
    try {
      // Crear FormData para enviar archivos
      const formData = new FormData();
      formData.append('title', titulo);
      formData.append('description', descripcion);
      formData.append('priority', prioridad);

      // Agregar documentos si hay
      Object.entries(documentos).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });

      const response = await fetch(`/api/solicitudes/${resolvedParams.id}`, {
        method: 'PATCH',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar solicitud');
      }

      alert('✅ Solicitud actualizada exitosamente');
      router.push(`/solicitudes/${resolvedParams.id}`);
    } catch (err: any) {
      console.error('Error:', err);
      alert('❌ ' + (err.message || 'Error al actualizar la solicitud'));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Image
                  src="/images/logo-oficial.png"
                  alt="Logo Universidad"
                  width={50}
                  height={50}
                  className="object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Sistema de Gestión
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando solicitud...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !solicitud) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Image
                  src="/images/logo-oficial.png"
                  alt="Logo Universidad"
                  width={50}
                  height={50}
                  className="object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Sistema de Gestión
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
            <p className="font-semibold">Error al cargar la solicitud</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => router.push('/solicitudes')}
              className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
            >
              ← Volver a Mis Solicitudes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Botón Volver */}
      <button
        onClick={() => router.push(`/solicitudes/${resolvedParams.id}`)}
        className="mb-6 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a la Solicitud
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Modificar Solicitud
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Actualiza la información de tu solicitud según las observaciones recibidas
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título de la Solicitud *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Solicitud de Ficha Técnica para Proyecto X"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              placeholder="Descripción breve de la solicitud"
            />
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prioridad
            </label>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          {/* Documentos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Actualizar Documentos (opcional)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Solo sube los documentos que deseas reemplazar
            </p>
            
            <div className="space-y-3">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <label className="block cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Formato 003
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {documentos['formato_003'] ? documentos['formato_003'].name : 'Seleccionar archivo...'}
                      </p>
                    </div>
                    {documentos['formato_003'] && (
                      <button
                        type="button"
                        onClick={() => handleFileChange('formato_003', null)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange('formato_003', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push(`/solicitudes/${resolvedParams.id}`)}
              className="flex-1 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : '✓ Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
