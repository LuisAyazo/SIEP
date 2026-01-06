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
    const { group_id } = body;

    if (!group_id) {
      return NextResponse.json(
        { error: 'Se requiere el ID del comité (group_id)' },
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

    // Verificar que el usuario es director del centro
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('center_id', solicitud.center_id)
      .single();

    if (!userRole || userRole.role !== 'director') {
      return NextResponse.json(
        { error: 'Solo el director del centro puede enviar solicitudes al comité' },
        { status: 403 }
      );
    }

    // Verificar que el estado actual es 'recibido'
    if (solicitud.estado !== 'recibido') {
      return NextResponse.json(
        { error: `No se puede enviar al comité una solicitud en estado '${solicitud.estado}'` },
        { status: 400 }
      );
    }

    // Verificar que el grupo (comité) existe y está activo
    const { data: group, error: groupError } = await supabase
      .from('user_groups')
      .select('*, user_group_members(count)')
      .eq('id', group_id)
      .eq('is_active', true)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Comité no encontrado o inactivo' },
        { status: 404 }
      );
    }

    // Verificar que el comité tiene al menos un miembro
    if (!group.user_group_members || group.user_group_members.length === 0) {
      return NextResponse.json(
        { error: 'El comité no tiene miembros asignados' },
        { status: 400 }
      );
    }

    // Validar transición usando función SQL
    const { data: validacion, error: validacionError } = await supabase
      .rpc('validate_solicitud_transition', {
        p_solicitud_id: solicitudId,
        p_new_estado: 'en_comite'
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
        estado: 'en_comite',
        group_id: group_id,
        fecha_enviado_comite: new Date().toISOString(),
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
    // 1. A todos los miembros del comité
    // 2. Al funcionario que creó la solicitud

    return NextResponse.json({
      success: true,
      solicitud: updatedSolicitud,
      message: `Solicitud enviada al comité "${group.name}" exitosamente`
    });

  } catch (error) {
    console.error('Error en PATCH /api/solicitudes/[id]/enviar-comite:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}