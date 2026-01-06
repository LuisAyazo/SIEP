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
        { error: 'Solo el director del centro puede recibir solicitudes' },
        { status: 403 }
      );
    }

    // Verificar que el estado actual es 'nuevo'
    if (solicitud.estado !== 'nuevo') {
      return NextResponse.json(
        { error: `No se puede recibir una solicitud en estado '${solicitud.estado}'` },
        { status: 400 }
      );
    }

    // Validar transición usando función SQL
    const { data: validacion, error: validacionError } = await supabase
      .rpc('validate_solicitud_transition', {
        p_solicitud_id: solicitudId,
        p_new_estado: 'recibido'
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
        estado: 'recibido',
        director_id: user.id,
        fecha_recibido: new Date().toISOString(),
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

    // TODO: Enviar notificación al funcionario
    // await createNotification({
    //   user_id: solicitud.created_by,
    //   type: 'success',
    //   message: 'Tu solicitud ha sido recibida por el director'
    // });

    return NextResponse.json({
      success: true,
      solicitud: updatedSolicitud,
      message: 'Solicitud recibida exitosamente'
    });

  } catch (error) {
    console.error('Error en PATCH /api/solicitudes/[id]/recibir:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}