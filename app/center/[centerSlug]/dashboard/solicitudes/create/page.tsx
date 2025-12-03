'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Upload, FileText, AlertCircle, Calendar, Flag } from 'lucide-react';

export default function CreateSolicitudPage({
  params
}: {
  params: Promise<{ centerSlug: string }>
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [centerId, setCenterId] = useState('');
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tipo: '',
    priority: 'normal',
    deadline: '',
    file_url: '',
    file_name: '',
    file_size: 0
  });

  useEffect(() => {
    loadCenter();
  }, []);

  async function loadCenter() {
    try {
      const { data } = await supabase
        .from('centers')
        .select('id')
        .eq('slug', resolvedParams.centerSlug)
        .single();

      if (data) {
        setCenterId(data.id);
      }
    } catch (err) {
      console.error('Error al cargar centro:', err);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no debe superar los 10MB');
      return;
    }

    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel
      'application/vnd.ms-excel',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word
      'image/jpeg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no permitido. Usa PDF, Excel, Word o imágenes');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `solicitudes/${centerId}/${fileName}`;

      // Subir archivo a Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size
      }));

    } catch (err: any) {
      console.error('Error al subir archivo:', err);
      setError(err.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.title || !formData.file_url || !centerId) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          center_id: centerId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear solicitud');
      }

      router.push(`/center/${resolvedParams.centerSlug}/dashboard/solicitudes`);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Solicitud</h1>
          <p className="text-gray-600 mt-1">Crea una nueva solicitud de ficha técnica</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Información de la Solicitud
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="Ej: Solicitud de creación de ficha técnica"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe los detalles de la solicitud..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Solicitud
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar...</option>
                <option value="creacion">Creación de Ficha</option>
                <option value="modificacion">Modificación de Ficha</option>
                <option value="actualizacion">Actualización de Datos</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Prioridad
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Baja</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha Límite (Opcional)
            </label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>
        </div>

        {/* Archivo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Documento Adjunto *
          </h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    {formData.file_name || 'Selecciona un archivo'}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    PDF, Excel, Word o Imagen (máx. 10MB)
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileUpload}
                    accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={uploading}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {uploading ? 'Subiendo...' : 'Seleccionar Archivo'}
                  </button>
                </label>
              </div>
              {formData.file_name && (
                <div className="mt-4 text-sm text-gray-600">
                  <p className="font-medium">{formData.file_name}</p>
                  <p className="text-xs">{(formData.file_size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500">
            El archivo se subirá de forma segura y solo será visible para los responsables del centro.
          </p>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || uploading || !formData.file_url}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando...' : 'Crear Solicitud'}
          </button>
        </div>
      </form>
    </div>
  );
}