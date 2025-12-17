import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 [members-info] Iniciando...');
    const { userIds } = await request.json();
    console.log('📋 [members-info] UserIds recibidos:', userIds);
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      console.log('⚠️ [members-info] No hay userIds, retornando array vacío');
      return NextResponse.json({ users: [] });
    }

    // Usar cliente admin para acceder a auth.users
    console.log('🔑 [members-info] Creando cliente admin...');
    const adminClient = createAdminClient();
    
    console.log('👥 [members-info] Obteniendo lista de usuarios...');
    const { data: { users }, error } = await adminClient.auth.admin.listUsers();

    if (error) {
      console.error('❌ [members-info] Error al obtener usuarios:', error);
      return NextResponse.json(
        { error: 'Error al obtener información de usuarios' },
        { status: 500 }
      );
    }

    console.log('✅ [members-info] Total usuarios en auth:', users.length);

    // Filtrar solo los usuarios solicitados
    const requestedUsers = users
      .filter(u => userIds.includes(u.id))
      .map(u => {
        console.log(`👤 [members-info] Usuario ${u.id}:`, {
          email: u.email,
          full_name: u.user_metadata?.full_name,
          name: u.user_metadata?.name,
          user_metadata: u.user_metadata
        });
        return {
          id: u.id,
          email: u.email || '',
          user_metadata: u.user_metadata || {}
        };
      });

    console.log('📦 [members-info] Usuarios filtrados:', requestedUsers.length);
    return NextResponse.json({ users: requestedUsers });

  } catch (error: any) {
    console.error('❌ [members-info] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}