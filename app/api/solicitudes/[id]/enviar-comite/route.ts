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

    // Verificar que el usuario pertenece al centro
    const { data: userCenter } = await supabase
      .from('user_centers')
      .select('center_id')
      .eq('user_id', user.id)
      .eq('center_id', solicitud.center_id)
      .single();

    if (!userCenter) {
      return NextResponse.json(
        { error: 'No tienes acceso a este centro' },
        { status: 403 }
      );
    }

    // Verificar que el usuario es director o administrador
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id);

    const roles = userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];
    const canSend = roles.includes('director') || roles.includes('administrador');

    if (!canSend) {
      return NextResponse.json(
        { error: 'Solo el director o administrador del centro puede enviar solicitudes al comité' },
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

    // Obtener el centro de servicios
    const { data: centroServicios, error: centroError } = await supabase
      .from('centers')
      .select('id, name')
      .eq('slug', 'centro-servicios')
      .single();

    if (centroError || !centroServicios) {
      return NextResponse.json(
        { error: 'Centro de servicios no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar estado de la solicitud
    const { data: updatedSolicitud, error: updateError } = await supabase
      .from('solicitudes')
      .update({
        status: 'en_comite',
        meeting_id: meeting_id,
        comite_id: meeting_id,
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
        comentario: comentario || `Solicitud enviada al comité "${meeting.title}" y asignada a ${centroServicios.name}`,
        realizado_por: user.id,
        metadata: {
          center_name: solicitud.centers?.name || 'Centro desconocido',
          assigned_to_center_name: centroServicios.name,
          meeting_title: meeting.title,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          fecha_cambio: new Date().toISOString()
        }
      });

    // Obtener todos los usuarios del centro de servicios para notificarlos
    const { data: usuariosCentroServicios } = await supabase
      .from('user_centers')
      .select('user_id, profiles(id, full_name, email)')
      .eq('center_id', centroServicios.id);

    // Obtener el grupo de notificación del centro de servicios (si existe)
    const { data: grupoNotificacion } = await supabase
      .from('user_groups')
      .select('id, nombre')
      .eq('centro_id', centroServicios.id)
      .eq('tipo', 'notificacion')
      .eq('activo', true)
      .single();

    let usuariosANotificar: string[] = [];

    if (grupoNotificacion) {
      // Si existe grupo de notificación, obtener sus miembros
      const { data: miembrosGrupo } = await supabase
        .from('user_group_members')
        .select('user_id')
        .eq('group_id', grupoNotificacion.id);
      
      usuariosANotificar = miembrosGrupo?.map(m => m.user_id) || [];
    } else if (usuariosCentroServicios) {
      // Si no hay grupo, notificar a todos los usuarios del centro
      usuariosANotificar = usuariosCentroServicios.map(uc => uc.user_id);
    }

    // Enviar notificaciones a los usuarios del centro de servicios
    if (usuariosANotificar.length > 0) {
      console.log(`📧 Enviando notificaciones a ${usuariosANotificar.length} usuarios del centro de servicios`);
      
      // Aquí puedes implementar el sistema de notificaciones
      // Por ahora, solo registramos en consola
      // TODO: Implementar sistema de notificaciones (email, push, etc.)
    }

    // Enviar notificación a los participantes del comité
    const { data: participantesComite } = await supabase
      .from('meeting_participants')
      .select('user_id')
      .eq('meeting_id', meeting_id);

    if (participantesComite && participantesComite.length > 0) {
      console.log(`📧 Notificando a ${participantesComite.length} participantes del comité`);
      // TODO: Implementar notificaciones a participantes del comité
    }

    return NextResponse.json({
      success: true,
      solicitud: updatedSolicitud,
      message: `Solicitud enviada al comité "${meeting.title}" y asignada a ${centroServicios.name}`,
      notificaciones: {
        centro_servicios: usuariosANotificar.length,
        comite: participantesComite?.length || 0
      }
    });

  } catch (error) {
    console.error('Error en PATCH /api/solicitudes/[id]/enviar-comite:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
