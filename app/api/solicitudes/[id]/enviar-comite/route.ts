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
    const { meeting_id, comentario } = body;

    if (!meeting_id) {
      return NextResponse.json(
        { error: 'Se requiere el ID del comité (meeting_id)' },
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
    if (solicitud.status !== 'recibido') {
      return NextResponse.json(
        { error: `No se puede enviar al comité una solicitud en estado '${solicitud.status}'` },
        { status: 400 }
      );
    }

    // Verificar que el meeting (comité) existe
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*, meeting_participants(count)')
      .eq('id', meeting_id)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json(
        { error: 'Comité no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el comité tiene participantes
    if (!meeting.meeting_participants || meeting.meeting_participants.length === 0) {
      return NextResponse.json(
        { error: 'El comité no tiene participantes asignados' },
        { status: 400 }
      );
    }

    // Actualizar estado de la solicitud
    const { data: updatedSolicitud, error: updateError } = await supabase
      .from('solicitudes')
      .update({
        status: 'en_comite',
        meeting_id: meeting_id,
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

    // Registrar en el historial
    await supabase
      .from('solicitud_historial')
      .insert({
        solicitud_id: solicitudId,
        accion: 'enviado_comite',
        estado_anterior: 'recibido',
        estado_nuevo: 'en_comite',
        comentario: comentario || `Solicitud enviada al comité "${meeting.title}"`,
        realizado_por: user.id
      });

    // TODO: Enviar notificaciones
    // 1. A todos los participantes del comité
    // 2. Al funcionario que creó la solicitud

    return NextResponse.json({
      success: true,
      solicitud: updatedSolicitud,
      message: `Solicitud enviada al comité "${meeting.title}" exitosamente`
    });

  } catch (error) {
    console.error('Error en PATCH /api/solicitudes/[id]/enviar-comite:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}