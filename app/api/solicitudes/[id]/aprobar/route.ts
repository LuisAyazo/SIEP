import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadFile } from '@/lib/supabase/storage';

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
    
    // Obtener FormData (puede incluir acta de comité)
    const formData = await request.formData();
    const actaComite = formData.get('acta_comite') as File | null;
    const observaciones = formData.get('observaciones') as string | null;

    // Validar que se adjunte el acta de comité
    if (!actaComite) {
      return NextResponse.json(
        { error: 'Se requiere adjuntar el acta de comité para aprobar' },
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
        { error: 'Solo los miembros del comité pueden aprobar solicitudes' },
        { status: 403 }
      );
    }

    // Verificar que el estado actual es 'en_comite'
    if (solicitud.estado !== 'en_comite') {
      return NextResponse.json(
        { error: `No se puede aprobar una solicitud en estado '${solicitud.estado}'` },
        { status: 400 }
      );
    }

    // Validar transición usando función SQL
    const { data: validacion, error: validacionError } = await supabase
      .rpc('validate_solicitud_transition', {
        p_solicitud_id: solicitudId,
        p_new_estado: 'aprobado'
      });

    if (validacionError || !validacion) {
      return NextResponse.json(
        { error: 'Transición de estado no válida' },
        { status: 400 }
      );
    }

    // Subir acta de comité a Storage
    const actaResult = await uploadFile({
      userId: user.id,
      solicitudId: solicitudId,
      tipoDocumento: 'acta_comite',
      file: actaComite
    });

    if (!actaResult.path) {
      return NextResponse.json(
        { error: 'Error al subir el acta de comité' },
        { status: 500 }
      );
    }

    // TODO: Generar Resolución (Word/PDF)
    // const resolucionPath = await generateResolucion(solicitud);

    // Obtener coordinador del centro
    const { data: coordinador } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('center_id', solicitud.center_id)
      .eq('role', 'coordinador')
      .single();

    // Actualizar estado de la solicitud
    const { data: updatedSolicitud, error: updateError } = await supabase
      .from('solicitudes')
      .update({
        estado: 'aprobado',
        acta_comite_path: actaResult.path,
        // resolucion_path: resolucionPath, // TODO: Cuando se implemente generación
        coordinador_id: coordinador?.user_id || null,
        observaciones: observaciones || null,
        fecha_aprobado: new Date().toISOString(),
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
    // 1. Al coordinador del centro
    // 2. Al funcionario que creó la solicitud
    // 3. Al director del centro

    return NextResponse.json({
      success: true,
      solicitud: updatedSolicitud,
      message: 'Solicitud aprobada exitosamente',
      documentos: {
        acta_comite: actaResult.path,
        // resolucion: resolucionPath // TODO
      }
    });

  } catch (error) {
    console.error('Error en PATCH /api/solicitudes/[id]/aprobar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}