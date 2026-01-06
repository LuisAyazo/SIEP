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
    const { observaciones } = body;

    if (!observaciones || observaciones.trim() === '') {
      return NextResponse.json(
        { error: 'Se requieren las observaciones' },
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

    // Verificar que el usuario es miembro del comité asignado
    const { data: membership } = await supabase
      .from('user_group_members')
      .select('*')
      .eq('group_id', solicitud.group_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Solo los miembros del comité pueden agregar observaciones' },
        { status: 403 }
      );
    }

    // Verificar que el estado actual es 'en_comite'
    if (solicitud.estado !== 'en_comite') {
      return NextResponse.json(
        { error: `No se pueden agregar observaciones a una solicitud en estado '${solicitud.estado}'` },
        { status: 400 }
      );
    }

    // Validar transición usando función SQL
    const { data: validacion, error: validacionError } = await supabase
      .rpc('validate_solicitud_transition', {
        p_solicitud_id: solicitudId,
        p_new_estado: 'observado'
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
        estado: 'observado',
        observaciones: observaciones,
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
    // 1. Al director del centro (para que decida si devolver al funcionario)

    return NextResponse.json({
      success: true,
      solicitud: updatedSolicitud,
      message: 'Observaciones agregadas exitosamente. El director debe revisar y decidir.'
    });

  } catch (error) {
    console.error('Error en PATCH /api/solicitudes/[id]/observar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}