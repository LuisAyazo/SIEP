import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id: solicitudId } = await params;
    const body = await request.json();
    const { motivo_rechazo } = body;

    console.log('🔍 DEBUG RECHAZAR - Body recibido:', body);
    console.log('🔍 DEBUG RECHAZAR - motivo_rechazo:', motivo_rechazo);
    console.log('🔍 DEBUG RECHAZAR - User ID:', user.id);

    if (!motivo_rechazo || motivo_rechazo.trim() === '') {
      console.log('❌ ERROR: Motivo de rechazo vacío');
      return NextResponse.json(
        { error: 'Se requiere especificar el motivo del rechazo' },
        { status: 400 }
      );
    }

    // Obtener la solicitud actual
    const { data: solicitud, error: fetchError } = await supabase
      .from('solicitudes')
      .select('id, status, center_id, comite_id, centers(id, name)')
      .eq('id', solicitudId)
      .single();

    console.log('🔍 DEBUG - Solicitud completa:', solicitud);
    console.log('🔍 DEBUG - Fetch error:', fetchError);

    if (fetchError || !solicitud) {
      console.log('❌ ERROR: Solicitud no encontrada');
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos según el estado actual
    let hasPermission = false;
    let userRole = '';

    console.log('🔍 DEBUG - Estado de solicitud:', solicitud.status);
    console.log('🔍 DEBUG - Center ID:', solicitud.center_id);
    console.log('🔍 DEBUG - Comite ID:', solicitud.comite_id);

    // Si está en estado 'nuevo' o 'recibido', solo el director puede rechazar
    if (solicitud.status === 'nuevo' || solicitud.status === 'recibido') {
      console.log('🔍 DEBUG - Verificando rol de director...');
      
      // Verificar si el usuario tiene rol de director
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id);

      console.log('🔍 DEBUG - User roles data:', userRoles);
      console.log('🔍 DEBUG - User roles error:', roleError);

      if (userRoles && userRoles.length > 0) {
        const hasDirectorRole = userRoles.some((ur: any) => ur.roles?.name === 'director' || ur.roles?.name === 'administrador');
        
        if (hasDirectorRole) {
          // Verificar si el usuario tiene acceso al centro de la solicitud
          const { data: userCenters } = await supabase
            .from('user_centers')
            .select('center_id')
            .eq('user_id', user.id)
            .eq('center_id', solicitud.center_id);

          console.log('🔍 DEBUG - User centers:', userCenters);

          if (userCenters && userCenters.length > 0) {
            hasPermission = true;
            userRole = 'director';
            console.log('✅ Permiso concedido como director del centro');
          } else {
            console.log('❌ Usuario es director pero no tiene acceso a este centro');
          }
        }
      }
    }

    // Si está en estado 'en_comite', solo miembros del comité pueden rechazar
    if (solicitud.status === 'en_comite' && solicitud.comite_id) {
      console.log('🔍 DEBUG - Verificando membresía en comité...');
      const { data: membership, error: memberError } = await supabase
        .from('user_group_members')
        .select('*')
        .eq('group_id', solicitud.comite_id)
        .eq('user_id', user.id)
        .single();

      console.log('🔍 DEBUG - Membership data:', membership);
      console.log('🔍 DEBUG - Membership error:', memberError);

      if (membership) {
        hasPermission = true;
        userRole = 'comite';
        console.log('✅ Permiso concedido como miembro del comité');
      }
    }

    if (!hasPermission) {
      console.log('❌ ERROR: Sin permisos para rechazar');
      console.log('❌ Estado:', solicitud.status);
      console.log('❌ User role encontrado:', userRole);
      return NextResponse.json(
        { error: 'No tienes permisos para rechazar esta solicitud' },
        { status: 403 }
      );
    }

    // Validar que el estado permite rechazo
    const estadosPermitidos = ['nuevo', 'recibido', 'en_comite'];
    if (!estadosPermitidos.includes(solicitud.status)) {
      console.log('❌ ERROR: Estado no permite rechazo:', solicitud.status);
      return NextResponse.json(
        { error: `No se puede rechazar una solicitud en estado '${solicitud.status}'` },
        { status: 400 }
      );
    }

    // Validar transición usando función SQL
    console.log('🔍 DEBUG - Validando transición de estado...');
    console.log('🔍 DEBUG - Estado actual:', solicitud.status);
    console.log('🔍 DEBUG - Estado nuevo: rechazado');
    console.log('🔍 DEBUG - User ID:', user.id);
    
    const { data: validacion, error: validacionError } = await supabase
      .rpc('validar_transicion_estado', {
        p_estado_actual: solicitud.status,
        p_estado_nuevo: 'rechazado',
        p_user_id: user.id
      });

    console.log('🔍 DEBUG - Validación resultado:', validacion);
    console.log('🔍 DEBUG - Validación error:', validacionError);

    if (validacionError) {
      console.error('❌ Error en validación de transición:', validacionError);
      return NextResponse.json(
        { error: 'Error al validar transición de estado', details: validacionError },
        { status: 500 }
      );
    }
    
    if (!validacion) {
      console.error('❌ Transición no válida');
      return NextResponse.json(
        { error: 'Transición de estado no válida. Verifica que tengas los permisos necesarios.' },
        { status: 403 }
      );
    }
    
    console.log('✅ Transición de estado validada correctamente');

    // Actualizar estado de la solicitud
    const { data: updatedSolicitud, error: updateError } = await supabase
      .from('solicitudes')
      .update({
        status: 'rechazado',
        motivo_rechazo: motivo_rechazo,
        fecha_rechazado: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitudId)
      .select()
      .single();

    console.log('✅ Solicitud actualizada:', updatedSolicitud);

    if (updateError) {
      console.error('Error actualizando solicitud:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la solicitud' },
        { status: 500 }
      );
    }

    // El trigger automáticamente creará el registro en solicitud_historial

    // TODO: Enviar notificaciones
    // 1. Al funcionario que creó la solicitud
    // 2. Al director del centro (si fue rechazado por comité)

    return NextResponse.json({
      success: true,
      solicitud: updatedSolicitud,
      message: `Solicitud rechazada por ${userRole}`,
      rechazado_por: userRole
    });

  } catch (error) {
    console.error('Error en PATCH /api/solicitudes/[id]/rechazar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}