"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Group {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: 'comite' | 'equipo' | 'notificacion' | 'personalizado';
  activo: boolean;
  created_at: string;
  center?: {
    name: string;
    slug: string;
  };
  _count?: {
    members: number;
  };
}

export default function GruposAdminPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    try {
      setLoading(true);
      setError(null);

      // Obtener todos los grupos con información del centro
      const { data, error: groupsError } = await supabase
        .from('user_groups')
        .select(`
          *,
          center:centers(name, slug)
        `)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Obtener conteo de miembros para cada grupo
      const groupsWithCount = await Promise.all(
        (data || []).map(async (group) => {
          const { count } = await supabase
            .from('user_group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          return {
            ...group,
            _count: {
              members: count || 0
            }
          };
        })
      );

      setGroups(groupsWithCount);
    } catch (err: any) {
      console.error('Error al cargar grupos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      comite: 'Comité',
      equipo: 'Equipo',
      notificacion: 'Notificación',
      personalizado: 'Personalizado'
    };
    return labels[tipo] || tipo;
  };

  const getTipoBadgeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      comite: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      equipo: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      notificacion: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      personalizado: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return colors[tipo] || colors.personalizado;
  };

  async function handleDeleteGroup(groupId: string, groupName: string) {
    if (!confirm(`¿Estás seguro de que deseas eliminar el grupo "${groupName}"? Esta acción no se puede deshacer y eliminará todos los miembros del grupo.`)) {
      return;
    }

    try {
      setError(null);

      // Primero eliminar todos los miembros del grupo
      const { error: membersError } = await supabase
        .from('user_group_members')
        .delete()
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      // Luego eliminar el grupo
      const { error: groupError } = await supabase
        .from('user_groups')
        .delete()
        .eq('id', groupId);

      if (groupError) throw groupError;

      // Recargar la lista de grupos
      await fetchGroups();
    } catch (err: any) {
      console.error('Error al eliminar grupo:', err);
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Cargando grupos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Grupos de Usuarios
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestiona grupos de usuarios de todos los centros (comités, equipos, etc.)
          </p>
        </div>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No hay grupos
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No se encontraron grupos en el sistema.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Centro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Miembros
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {groups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {group.nombre}
                      </div>
                      {group.descripcion && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {group.descripcion}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {group.center?.name || 'Sin centro'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTipoBadgeColor(group.tipo)}`}>
                      {getTipoLabel(group.tipo)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {group._count?.members || 0} miembros
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      group.activo 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {group.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {group.center?.slug && (
                      <>
                        <Link
                          href={`/center/${group.center.slug}/groups/${group.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                        >
                          Gestionar
                        </Link>
                        <Link
                          href={`/center/${group.center.slug}/groups/${group.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                        >
                          Editar
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteGroup(group.id, group.nombre)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
