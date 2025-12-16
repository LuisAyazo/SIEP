'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSupabaseSession } from '@/components/providers/SessionProvider';

export default function DebugUserPage() {
  const { session } = useSupabaseSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDebugData() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      
      try {
        // 1. Obtener perfil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // 2. Obtener TODOS los roles
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select(`
            id,
            user_id,
            role_id,
            created_at,
            roles (
              id,
              name,
              display_name
            )
          `)
          .eq('user_id', session.user.id);

        // 3. Obtener TODOS los centros
        const { data: userCenters, error: centersError } = await supabase
          .from('user_centers')
          .select(`
            id,
            user_id,
            center_id,
            created_at,
            centers (
              id,
              name,
              slug
            )
          `)
          .eq('user_id', session.user.id);

        // 4. Obtener todos los roles disponibles
        const { data: allRoles } = await supabase
          .from('roles')
          .select('*')
          .order('name');

        // 5. Obtener todos los centros disponibles
        const { data: allCenters } = await supabase
          .from('centers')
          .select('*')
          .order('name');

        setData({
          session: {
            userId: session.user.id,
            email: session.user.email,
            metadata: session.user.user_metadata
          },
          profile,
          profileError,
          userRoles,
          rolesError,
          userCenters,
          centersError,
          allRoles,
          allCenters
        });
      } catch (error) {
        console.error('Error fetching debug data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDebugData();
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Cargando datos de diagnóstico...</h1>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">No hay sesión activa</h1>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔍 Diagnóstico de Usuario</h1>

      {/* Sesión */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-blue-600">📋 Sesión Actual</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(data?.session, null, 2)}
        </pre>
      </div>

      {/* Perfil */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-green-600">👤 Perfil</h2>
        {data?.profileError ? (
          <div className="text-red-600">Error: {JSON.stringify(data.profileError)}</div>
        ) : (
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(data?.profile, null, 2)}
          </pre>
        )}
      </div>

      {/* Roles del Usuario */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-purple-600">
          🎭 Roles Asignados ({data?.userRoles?.length || 0})
        </h2>
        {data?.userRoles?.length > 1 && (
          <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700 font-bold">
              ⚠️ ADVERTENCIA: Este usuario tiene {data.userRoles.length} roles. Debería tener solo 1.
            </p>
          </div>
        )}
        {data?.rolesError ? (
          <div className="text-red-600">Error: {JSON.stringify(data.rolesError)}</div>
        ) : (
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(data?.userRoles, null, 2)}
          </pre>
        )}
      </div>

      {/* Centros del Usuario */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-orange-600">
          🏢 Centros Asignados ({data?.userCenters?.length || 0})
        </h2>
        {data?.centersError ? (
          <div className="text-red-600">Error: {JSON.stringify(data.centersError)}</div>
        ) : (
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(data?.userCenters, null, 2)}
          </pre>
        )}
      </div>

      {/* Todos los Roles */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-indigo-600">
          📚 Todos los Roles Disponibles
        </h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(data?.allRoles, null, 2)}
        </pre>
      </div>

      {/* Todos los Centros */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-teal-600">
          🏛️ Todos los Centros Disponibles
        </h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(data?.allCenters, null, 2)}
        </pre>
      </div>
    </div>
  );
}