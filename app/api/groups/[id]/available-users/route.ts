import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 [available-users] Iniciando...');
    const supabase = await createClient();
    const { id: groupId } = await params;
    console.log('📋 [available-users] Group ID:', groupId);

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ [available-users] Error de autenticación:', authError);
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    console.log('✅ [available-users] Usuario autenticado:', user.id);

    // Obtener información del grupo
    const { data: group, error: groupError } = await supabase
      .from('user_groups')
      .select('centro_id')
      .eq('id', groupId)
      .single();

    if (groupError) {
      console.error('❌ [available-users] Error al obtener grupo:', groupError);
      return NextResponse.json(
        { error: 'Grupo no encontrado' },
        { status: 404 }
      );
    }
    console.log('✅ [available-users] Grupo encontrado, centro_id:', group.centro_id);

    // Obtener miembros actuales del grupo
    const { data: currentMembers } = await supabase
      .from('user_group_members')
      .select('user_id')
      .eq('group_id', groupId);

    const excludeIds = (currentMembers || []).map(m => m.user_id);
    console.log('📊 [available-users] Miembros actuales:', excludeIds.length);

    // Obtener usuarios del centro usando user_centers
    const { data: userCenters, error: userCentersError } = await supabase
      .from('user_centers')
      .select('user_id')
      .eq('center_id', group.centro_id);

    if (userCentersError) {
      console.error('❌ [available-users] Error al obtener user_centers:', userCentersError);
      return NextResponse.json(
        { error: 'Error al obtener usuarios' },
        { status: 500 }
      );
    }
    console.log('📊 [available-users] Usuarios en el centro:', userCenters?.length || 0);

    // Filtrar usuarios que no están en el grupo
    const availableUserIds = (userCenters || [])
      .map(uc => uc.user_id)
      .filter(id => !excludeIds.includes(id));

    console.log('📊 [available-users] Usuarios disponibles (IDs):', availableUserIds.length);

    if (availableUserIds.length === 0) {
      console.log('⚠️ [available-users] No hay usuarios disponibles');
      return NextResponse.json({ users: [] });
    }

    // Obtener información de usuarios desde auth.users usando admin API
    console.log('🔑 [available-users] Creando cliente admin...');
    const adminClient = createAdminClient();
    console.log('✅ [available-users] Cliente admin creado');
    
    console.log('👥 [available-users] Obteniendo lista de usuarios de auth...');
    const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers();

    if (usersError) {
      console.error('Error al obtener usuarios de auth:', usersError);
      return NextResponse.json(
        { error: 'Error al obtener información de usuarios' },
        { status: 500 }
      );
    }

    console.log('Total usuarios en auth:', users.length);
    console.log('IDs de usuarios del centro:', availableUserIds);
    console.log('IDs excluidos (ya en grupo):', excludeIds);

    // Filtrar y formatear usuarios disponibles
    const availableUsers = users
      .filter(u => availableUserIds.includes(u.id))
      .map(u => ({
        id: u.id,
        email: u.email || '',
        user_metadata: u.user_metadata || {}
      }));

    console.log('Usuarios disponibles para agregar:', availableUsers.length);

    return NextResponse.json({
      users: availableUsers,
      debug: {
        totalAuthUsers: users.length,
        centerUserIds: availableUserIds.length,
        excludedIds: excludeIds.length,
        availableUsers: availableUsers.length
      }
    });

  } catch (error: any) {
    console.error('Error en available-users:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}