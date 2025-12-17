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
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  rol_en_grupo: 'presidente' | 'secretario' | 'miembro';
  created_at: string;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
  };
}

export default function GroupDetailPage() {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [usersInfo, setUsersInfo] = useState<Map<string, UserInfo>>(new Map());
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<'presidente' | 'secretario' | 'miembro'>('miembro');
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const centerSlug = params.centerSlug as string;
  const groupId = params.id as string;

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  async function fetchGroupData() {
    try {
      setLoading(true);
      setError(null);

      // Obtener información del grupo
      const { data: groupData, error: groupError } = await supabase
        .from('user_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Obtener miembros del grupo
      const { data: membersData, error: membersError } = await supabase
        .from('user_group_members')
        .select('id, user_id, rol_en_grupo, created_at')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (membersError) throw membersError;
      
      setMembers(membersData || []);

      // Obtener información de usuarios para los miembros
      if (membersData && membersData.length > 0) {
        await fetchUsersInfo(membersData.map(m => m.user_id));
      }

      // Obtener usuarios disponibles para agregar
      await fetchAvailableUsers(groupData.centro_id, (membersData || []).map(m => m.user_id));

    } catch (err: any) {
      console.error('Error al cargar datos del grupo:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsersInfo(userIds: string[]) {
    try {
      console.log('🔍 [fetchUsersInfo] Iniciando con userIds:', userIds);
      
      // Crear un endpoint especial para obtener info de usuarios específicos
      const response = await fetch(`/api/groups/${groupId}/members-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });
      
      console.log('📡 [fetchUsersInfo] Response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ [fetchUsersInfo] Error al obtener info de usuarios:', response.statusText);
        return;
      }
      
      const data = await response.json();
      console.log('📦 [fetchUsersInfo] Data recibida:', data);
      
      const users = data.users || [];
      console.log('👥 [fetchUsersInfo] Usuarios procesados:', users.length);
      
      const usersMap = new Map<string, UserInfo>();
      users.forEach((user: any) => {
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
        console.log(`👤 [fetchUsersInfo] Usuario ${user.id}:`, {
          email: user.email,
          full_name: user.user_metadata?.full_name,
          name: user.user_metadata?.name,
          userName
        });
        
        usersMap.set(user.id, {
          id: user.id,
          email: user.email,
          name: userName
        });
      });
      
      console.log('✅ [fetchUsersInfo] UsersMap creado con', usersMap.size, 'usuarios');
      setUsersInfo(usersMap);
    } catch (err: any) {
      console.error('❌ [fetchUsersInfo] Error:', err);
    }
  }

  async function fetchAvailableUsers(centroId: string, excludeIds: string[]) {
    try {
      const response = await fetch(`/api/groups/${groupId}/available-users`);
      
      if (!response.ok) {
        throw new Error('Error al obtener usuarios disponibles');
      }

      const data = await response.json();
      setAvailableUsers(data.users || []);
    } catch (err: any) {
      console.error('Error al cargar usuarios disponibles:', err);
    }
  }

  async function handleAddMembers() {
    if (selectedUserIds.length === 0) return;

    try {
      setAdding(true);
      setError(null);

      // Insertar múltiples miembros
      const membersToInsert = selectedUserIds.map(userId => ({
        group_id: groupId,
        user_id: userId,
        rol_en_grupo: selectedRole
      }));

      const { error: insertError } = await supabase
        .from('user_group_members')
        .insert(membersToInsert);

      if (insertError) throw insertError;

      // Recargar datos
      await fetchGroupData();
      
      // Resetear formulario
      setShowAddMember(false);
      setSelectedUserId("");
      setSelectedUserIds([]);
      setSelectedRole('miembro');
      setSearchTerm("");
      setCurrentPage(1);
    } catch (err: any) {
      console.error('Error al agregar miembros:', err);
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = (filteredUsers: User[]) => {
    const allIds = filteredUsers.map(u => u.id);
    if (selectedUserIds.length === allIds.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(allIds);
    }
  };

  async function handleRemoveMember(memberId: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este miembro del grupo?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('user_group_members')
        .delete()
        .eq('id', memberId);

      if (deleteError) throw deleteError;

      // Recargar datos
      await fetchGroupData();
    } catch (err: any) {
      console.error('Error al eliminar miembro:', err);
      setError(err.message);
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

  const getRolLabel = (rol: string) => {
    const labels: Record<string, string> = {
      presidente: 'Presidente',
      secretario: 'Secretario',
      miembro: 'Miembro'
    };
    return labels[rol] || rol;
  };

  const getRolBadgeColor = (rol: string) => {
    const colors: Record<string, string> = {
      presidente: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      secretario: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      miembro: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return colors[rol] || colors.miembro;
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <Link href={`/center/${centerSlug}/groups`} className="hover:text-gray-700 dark:hover:text-gray-300">
            Grupos
          </Link>
          <span>/</span>
          <span>{group?.nombre}</span>
        </div>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {group?.nombre}
            </h1>
            {group?.descripcion && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {group.descripcion}
              </p>
            )}
            <div className="mt-2 flex items-center space-x-3">
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {getTipoLabel(group?.tipo || '')}
              </span>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                group?.activo 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {group?.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
          <Link
            href={`/center/${centerSlug}/groups/${groupId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar Grupo
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Members Section */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Miembros ({members.length})
          </h2>
          <button
            onClick={() => setShowAddMember(!showAddMember)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar Miembro
          </button>
        </div>

        {/* Add Member Form */}
        {showAddMember && (() => {
          const filteredUsers = availableUsers.filter(user => {
            const searchLower = searchTerm.toLowerCase();
            const name = user.user_metadata?.name?.toLowerCase() || '';
            const email = user.email.toLowerCase();
            return name.includes(searchLower) || email.includes(searchLower);
          });

          const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

          return (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                {/* Barra de búsqueda y contador */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedUserIds.length > 0 && (
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {selectedUserIds.length} seleccionado{selectedUserIds.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {selectedUserIds.length === 0 && (
                      <span>{filteredUsers.length} disponible{filteredUsers.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>

                {/* Selector de rol */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rol para usuarios seleccionados:
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as any)}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="miembro">Miembro</option>
                    <option value="secretario">Secretario</option>
                    <option value="presidente">Presidente</option>
                  </select>
                </div>

                {/* Tabla de usuarios */}
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12 border border-gray-300 dark:border-gray-600 rounded-md">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios disponibles'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                                onChange={() => toggleSelectAll(filteredUsers)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Usuario
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Email
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {paginatedUsers.map(user => (
                            <tr
                              key={user.id}
                              className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                                selectedUserIds.includes(user.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                              onClick={() => toggleUserSelection(user.id)}
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedUserIds.includes(user.id)}
                                  onChange={() => toggleUserSelection(user.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8">
                                    <div className="h-8 w-8 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                                      {(user.user_metadata?.full_name || user.user_metadata?.name || user.email).charAt(0).toUpperCase()}
                                    </div>
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {user.user_metadata?.full_name || user.user_metadata?.name || 'Sin nombre'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {user.email}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredUsers.length)} de {filteredUsers.length}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            Anterior
                          </button>
                          <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                            Página {currentPage} de {totalPages}
                          </span>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            Siguiente
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Botones de acción */}
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddMember(false);
                    setSelectedUserId("");
                    setSelectedUserIds([]);
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddMembers}
                  disabled={selectedUserIds.length === 0 || adding}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? 'Agregando...' : `Agregar ${selectedUserIds.length} Usuario${selectedUserIds.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          );
        })()}

        {/* Members List */}
        {members.length === 0 ? (
          <div className="px-6 py-12 text-center">
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
              No hay miembros
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comienza agregando miembros a este grupo.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {members.map((member) => {
          const userInfo = usersInfo.get(member.user_id);
          const displayName = userInfo?.name || userInfo?.email || 'Usuario';
          const displayEmail = userInfo?.email || '';
          
          return (
            <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white font-medium">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {displayName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {displayEmail}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRolBadgeColor(member.rol_en_grupo)}`}>
                  {getRolLabel(member.rol_en_grupo)}
                </span>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
        )}
      </div>
    </div>
  );
}