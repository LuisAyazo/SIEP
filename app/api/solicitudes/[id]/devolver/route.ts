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
    const { comentario } = body;

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
        { error: 'Solo el director del centro puede devolver solicitudes al funcionario' },
        { status: 403 }
      );
    }

    // Verificar que el estado actual es 'observado'
    if (solicitud.estado !== 'observado') {
      return NextResponse.json(
        { error: `Solo se pueden devolver solicitudes en estado 'observado'. Estado actual: '${solicitud.estado}'` },
        { status: 400 }
      );
    }

    // Validar transición usando función SQL (observado → nuevo)
    const { data: validacion, error: validacionError } = await supabase
      .rpc('validate_solicitud_transition', {
        p_solicitud_id: solicitudId,
        p_new_estado: 'nuevo'
      });

    if (validacionError || !validacion) {
      return NextResponse.json(
        { error: 'Transición de estado no válida' },
        { status: 400 }
      );
    }

    // Actualizar estado de la solicitud (vuelve a 'nuevo' para que el funcionario pueda editar)
    const { data: updatedSolicitud, error: updateError } = await supabase
      .from('solicitudes')
      .update({
        estado: 'nuevo',
        // Mantener las observaciones para que el funcionario las vea
        // observaciones ya está guardado de la transición anterior
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

    // Si hay comentario adicional del director, agregarlo al historial
    // El trigger ya creará el registro básico, pero podemos actualizar el último con el comentario
    if (comentario && comentario.trim() !== '') {
      // Obtener el último registro del historial (recién creado por el trigger)
      const { data: ultimoHistorial } = await supabase
        .from('solicitud_historial')
        .select('*')
        .eq('solicitud_id', solicitudId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (ultimoHistorial) {
        await supabase
          .from('solicitud_historial')
          .update({ comentario: comentario })
          .eq('id', ultimoHistorial.id);
      }
    }

    // TODO: Enviar notificaciones
    // 1. Al funcionario que creó la solicitud (con las observaciones del comité)

    return NextResponse.json({
      success: true,
      solicitud: updatedSolicitud,
      message: 'Solicitud devuelta al funcionario para correcciones',
      observaciones: solicitud.observaciones
    });

  } catch (error) {
    console.error('Error en PATCH /api/solicitudes/[id]/devolver:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}