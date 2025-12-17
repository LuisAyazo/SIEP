"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type TipoGrupo = 'comite' | 'equipo' | 'notificacion' | 'personalizado';

interface Group {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoGrupo;
  activo: boolean;
}

export default function EditGroupPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tipo: "equipo" as TipoGrupo,
    activo: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const centerSlug = params.centerSlug as string;
  const groupId = params.id as string;

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  async function fetchGroup() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (fetchError) throw fetchError;

      setGroup(data);
      setFormData({
        nombre: data.nombre,
        descripcion: data.descripcion || "",
        tipo: data.tipo,
        activo: data.activo
      });
    } catch (err: any) {
      console.error('Error al cargar grupo:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('user_groups')
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
          tipo: formData.tipo,
          activo: formData.activo
        })
        .eq('id', groupId);

      if (updateError) throw updateError;

      // Redirigir a la lista de grupos
      router.push(`/center/${centerSlug}/groups`);
    } catch (err: any) {
      console.error('Error al actualizar grupo:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este grupo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('user_groups')
        .delete()
        .eq('id', groupId);

      if (deleteError) throw deleteError;

      router.push(`/center/${centerSlug}/groups`);
    } catch (err: any) {
      console.error('Error al eliminar grupo:', err);
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando grupo...</div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        <Link
          href={`/center/${centerSlug}/groups`}
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          ← Volver a grupos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <Link href={`/center/${centerSlug}/groups`} className="hover:text-gray-700 dark:hover:text-gray-300">
            Grupos
          </Link>
          <span>/</span>
          <span>Editar Grupo</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Editar Grupo
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Modifica la información del grupo
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 space-y-6">
          {/* Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre del Grupo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              required
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ej: Comité de Extensión"
            />
          </div>

          {/* Tipo */}
          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Grupo <span className="text-red-500">*</span>
            </label>
            <select
              id="tipo"
              name="tipo"
              required
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="comite">Comité</option>
              <option value="equipo">Equipo</option>
              <option value="notificacion">Lista de Notificación</option>
              <option value="personalizado">Personalizado</option>
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formData.tipo === 'comite' && 'Grupo para evaluación de solicitudes y toma de decisiones'}
              {formData.tipo === 'equipo' && 'Grupo de trabajo colaborativo'}
              {formData.tipo === 'notificacion' && 'Lista para envío de notificaciones masivas'}
              {formData.tipo === 'personalizado' && 'Grupo con propósito personalizado'}
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={3}
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Describe el propósito de este grupo..."
            />
          </div>

          {/* Estado */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="activo"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="activo" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Grupo activo
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="px-4 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Eliminar Grupo
          </button>
          
          <div className="flex space-x-3">
            <Link
              href={`/center/${centerSlug}/groups`}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </form>

      {/* Link to manage members */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Gestionar Miembros
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Agrega o elimina miembros de este grupo
            </p>
          </div>
          <Link
            href={`/center/${centerSlug}/groups/${groupId}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Ver Miembros
          </Link>
        </div>
      </div>
    </div>
  );
}