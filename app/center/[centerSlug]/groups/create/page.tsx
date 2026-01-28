"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X } from "lucide-react";

interface GroupType {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export default function CreateGroupPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tipo: "",
    activo: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupTypes, setGroupTypes] = useState<GroupType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showNewTypeModal, setShowNewTypeModal] = useState(false);
  const [newType, setNewType] = useState({ nombre: "", descripcion: "" });
  const [creatingType, setCreatingType] = useState(false);
  
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const centerSlug = params.centerSlug as string;

  // Cargar tipos de grupo y verificar si es admin
  useEffect(() => {
    async function loadData() {
      try {
        // Verificar si es administrador
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('roles!inner(name)')
            .eq('user_id', user.id);
          
          const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
          setIsAdmin(roles.includes('administrador'));
        }

        // Cargar tipos de grupo
        const { data, error } = await supabase
          .from('group_types')
          .select('*')
          .eq('activo', true)
          .order('nombre');

        if (error) throw error;
        setGroupTypes(data || []);
        
        // Seleccionar el primer tipo por defecto
        if (data && data.length > 0) {
          setFormData(prev => ({ ...prev, tipo: data[0].nombre }));
        }
      } catch (err) {
        console.error('Error cargando tipos:', err);
      } finally {
        setLoadingTypes(false);
      }
    }

    loadData();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Obtener el centro actual
      const { data: centerData, error: centerError } = await supabase
        .from('centers')
        .select('id')
        .eq('slug', centerSlug)
        .single();

      if (centerError) throw centerError;

      // Crear el grupo
      const { data, error: insertError } = await supabase
        .from('user_groups')
        .insert({
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
          tipo: formData.tipo,
          activo: formData.activo,
          centro_id: centerData.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Redirigir a la lista de grupos
      router.push(`/center/${centerSlug}/groups`);
    } catch (err: any) {
      console.error('Error al crear grupo:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewType = async () => {
    if (!newType.nombre.trim()) {
      alert('El nombre del tipo es requerido');
      return;
    }

    setCreatingType(true);
    try {
      const { data, error } = await supabase
        .from('group_types')
        .insert({
          nombre: newType.nombre.trim(),
          descripcion: newType.descripcion.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      // Agregar el nuevo tipo a la lista
      setGroupTypes(prev => [...prev, data]);
      
      // Seleccionar el nuevo tipo
      setFormData(prev => ({ ...prev, tipo: data.nombre }));
      
      // Cerrar modal y limpiar
      setShowNewTypeModal(false);
      setNewType({ nombre: "", descripcion: "" });
    } catch (err: any) {
      console.error('Error creando tipo:', err);
      alert('Error al crear tipo: ' + err.message);
    } finally {
      setCreatingType(false);
    }
  };

  const handleDeleteType = async (typeId: string, typeName: string) => {
    if (!confirm(`¿Estás seguro de eliminar el tipo "${typeName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('group_types')
        .update({ activo: false })
        .eq('id', typeId);

      if (error) throw error;

      // Remover de la lista
      setGroupTypes(prev => prev.filter(t => t.id !== typeId));
      
      // Si era el tipo seleccionado, cambiar al primero disponible
      if (formData.tipo === typeName && groupTypes.length > 1) {
        const remaining = groupTypes.filter(t => t.id !== typeId);
        setFormData(prev => ({ ...prev, tipo: remaining[0]?.nombre || "" }));
      }
    } catch (err: any) {
      console.error('Error eliminando tipo:', err);
      alert('Error al eliminar tipo: ' + err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const selectedTypeDescription = groupTypes.find(t => t.nombre === formData.tipo)?.descripcion;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <Link href={`/center/${centerSlug}/groups`} className="hover:text-gray-700 dark:hover:text-gray-300">
            Grupos
          </Link>
          <span>/</span>
          <span>Crear Grupo</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Crear Nuevo Grupo
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Crea un grupo de usuarios para organizar comités, equipos o listas de notificación
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
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de Grupo <span className="text-red-500">*</span>
              </label>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowNewTypeModal(true)}
                  className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Tipo
                </button>
              )}
            </div>
            
            {loadingTypes ? (
              <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                Cargando tipos...
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <select
                    id="tipo"
                    name="tipo"
                    required
                    value={formData.tipo}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {groupTypes.map(type => (
                      <option key={type.id} value={type.nombre}>
                        {type.nombre}
                      </option>
                    ))}
                  </select>
                  
                  {isAdmin && formData.tipo && (
                    <button
                      type="button"
                      onClick={() => {
                        const typeToDelete = groupTypes.find(t => t.nombre === formData.tipo);
                        if (typeToDelete) {
                          handleDeleteType(typeToDelete.id, typeToDelete.nombre);
                        }
                      }}
                      className="px-3 py-2 border border-red-300 dark:border-red-600 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Eliminar tipo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {selectedTypeDescription && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {selectedTypeDescription}
                  </p>
                )}
              </>
            )}
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
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <Link
            href={`/center/${centerSlug}/groups`}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading || loadingTypes}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando...' : 'Crear Grupo'}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Información sobre grupos
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc list-inside space-y-1">
                <li>Después de crear el grupo, podrás agregar miembros</li>
                <li>Los grupos de tipo "Comité" se usan para evaluar solicitudes</li>
                <li>Los grupos inactivos no aparecerán en las listas de selección</li>
                {isAdmin && <li className="font-medium">Como administrador, puedes crear y eliminar tipos de grupo</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear nuevo tipo */}
      {showNewTypeModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Crear Nuevo Tipo de Grupo
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del Tipo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newType.nombre}
                    onChange={(e) => setNewType(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ej: Notificaciones de Solicitudes"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={newType.descripcion}
                    onChange={(e) => setNewType(prev => ({ ...prev, descripcion: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Describe el propósito de este tipo..."
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewTypeModal(false);
                    setNewType({ nombre: "", descripcion: "" });
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewType}
                  disabled={creatingType}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingType ? 'Creando...' : 'Crear Tipo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
