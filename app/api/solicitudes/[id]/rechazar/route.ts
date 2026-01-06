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

    if (!motivo_rechazo || motivo_rechazo.trim() === '') {
      return NextResponse.json(
        { error: 'Se requiere especificar el motivo del rechazo' },
        { status: 400 }
      );
    }

    // Obtener la solicitud actual
    const { data: solicitud, error: fetchError } = await supabase
      .from('solicitudes')
      .select('*, centers(id, name)')
      .eq('id', solicitudId)
      .single();

    if (fetchError || !solicitud) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos según el estado actual
    let hasPermission = false;
    let userRole = '';

    // Si está en estado 'nuevo' o 'recibido', solo el director puede rechazar
    if (solicitud.estado === 'nuevo' || solicitud.estado === 'recibido') {
      const { data: directorRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('center_id', solicitud.center_id)
        .single();

      if (directorRole && directorRole.role === 'director') {
        hasPermission = true;
        userRole = 'director';
      }
    }

    // Si está en estado 'en_comite', solo miembros del comité pueden rechazar
    if (solicitud.estado === 'en_comite') {
      const { data: membership } = await supabase
        .from('user_group_members')
        .select('*')
        .eq('group_id', solicitud.group_id)
        .eq('user_id', user.id)
        .single();

      if (membership) {
        hasPermission = true;
        userRole = 'comite';
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para rechazar esta solicitud' },
        { status: 403 }
      );
    }

    // Validar que el estado permite rechazo
    const estadosPermitidos = ['nuevo', 'recibido', 'en_comite'];
    if (!estadosPermitidos.includes(solicitud.estado)) {
      return NextResponse.json(
        { error: `No se puede rechazar una solicitud en estado '${solicitud.estado}'` },
        { status: 400 }
      );
    }

    // Validar transición usando función SQL
    const { data: validacion, error: validacionError } = await supabase
      .rpc('validate_solicitud_transition', {
        p_solicitud_id: solicitudId,
        p_new_estado: 'rechazado'
      });

    if (validacionError || !validacion) {
      return NextResponse.json(
        { error: 'Transición de estado no válida' },
        { status: 400 }
      );
    }

    // Actualizar estado de la solicitud
    const { data: updatedSolicitud, error: updateError } = await supabase
      .from('solicitudes')
      .update({
        estado: 'rechazado',
        motivo_rechazo: motivo_rechazo,
        fecha_rechazado: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitudId)
      .select()
      .single();

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