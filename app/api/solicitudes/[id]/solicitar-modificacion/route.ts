import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

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
    const { motivo, descripcion } = body;

    if (!motivo || motivo.trim() === '') {
      return NextResponse.json(
        { error: 'Debe proporcionar un motivo para la solicitud de modificación' },
        { status: 400 }
      );
    }

    // Obtener la solicitud
    const { data: solicitud, error: fetchError } = await supabase
      .from('solicitudes')
      .select('*, center:centers(id, name, slug), created_by_profile:profiles!solicitudes_created_by_fkey(id, email, full_name)')
      .eq('id', solicitudId)
      .single();

    if (fetchError || !solicitud) {
      console.error('Error al obtener solicitud:', fetchError);
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la solicitud no esté en un estado final
    if (['aprobado', 'rechazado', 'cancelado'].includes(solicitud.status)) {
      return NextResponse.json(
        { error: `No se puede solicitar modificación de una solicitud ${solicitud.status}` },
        { status: 400 }
      );
    }

    // Registrar en el historial
    const comentarioCompleto = descripcion 
      ? `Solicitud de modificación: ${motivo}. ${descripcion}`
      : `Solicitud de modificación: ${motivo}`;

    const { error: historialError } = await supabase
      .from('solicitud_historial')
      .insert({
        solicitud_id: solicitudId,
        estado_anterior: solicitud.status,
        estado_nuevo: solicitud.status, // Se mantiene el mismo estado
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email,
        user_role: 'Centro',
        comentario: comentarioCompleto
      });

    if (historialError) {
      console.error('Error al registrar historial:', historialError);
    }

    // Registrar en modificaciones
    if (solicitud.center_id) {
      const { error: modError } = await supabase
        .from('modificaciones')
        .insert({
          centro_id: solicitud.center_id,
          tipo: 'solicitud',
          accion: 'solicitar_modificacion',
          descripcion: `Solicitud de modificación para #${solicitudId.slice(0, 8)}: ${motivo}`,
          usuario_id: user.id,
          usuario_nombre: user.user_metadata?.full_name || user.email,
          metadata: {
            solicitud_id: solicitudId,
            estado: solicitud.status,
            motivo: motivo,
            descripcion: descripcion
          }
        });

      if (modError) {
        console.error('Error al registrar modificación:', modError);
      }
    }

    // Crear notificación para el creador de la solicitud
    if (solicitud.created_by_profile?.id) {
      try {
        const adminClient = createAdminClient();
        
        const notification = {
          user_id: solicitud.created_by_profile.id,
          type: 'info' as const,
          title: 'Solicitud de Modificación',
          message: `El centro ${solicitud.center?.name || 'destinatario'} solicita modificaciones en tu solicitud "${solicitud.title || solicitud.nombre_proyecto}". Motivo: ${motivo}`,
          link: `/solicitudes/${solicitudId}`,
          center_name: solicitud.center?.name || null,
          read: false
        };

        console.log('📨 [Solicitar Modificación] Creando notificación para el creador');

        const { error: notifError } = await adminClient
          .from('notifications')
          .insert(notification);

        if (notifError) {
          console.error('❌ [Solicitar Modificación] Error al crear notificación:', notifError);
        } else {
          console.log('✅ [Solicitar Modificación] Notificación creada exitosamente');
        }
      } catch (notifError) {
        console.error('❌ [Solicitar Modificación] Error en sistema de notificaciones:', notifError);
        // No fallar la solicitud si falla la notificación
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitud de modificación registrada exitosamente'
    });

  } catch (error) {
    console.error('Error en PATCH /api/solicitudes/[id]/solicitar-modificacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
