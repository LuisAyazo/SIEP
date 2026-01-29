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
    const { motivo } = body;

    if (!motivo || motivo.trim() === '') {
      return NextResponse.json(
        { error: 'Debe proporcionar un motivo de cancelación' },
        { status: 400 }
      );
    }

    // Obtener la solicitud
    const { data: solicitud, error: fetchError } = await supabase
      .from('solicitudes')
      .select('*, center:centers(id, name, slug)')
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
        { error: `No se puede cancelar una solicitud ${solicitud.status}` },
        { status: 400 }
      );
    }

    // Actualizar la solicitud a cancelado
    console.log('🔄 Intentando actualizar solicitud:', solicitudId, 'a estado cancelado');
    console.log('👤 Usuario actual:', user.id);
    console.log('📋 Solicitud creada por:', solicitud.created_by);
    
    const { data: updateData, error: updateError } = await supabase
      .from('solicitudes')
      .update({
        status: 'cancelado',
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitudId)
      .select();

    console.log('✅ Resultado del UPDATE:', { updateData, updateError });

    if (updateError) {
      console.error('❌ Error al cancelar solicitud:', updateError);
      return NextResponse.json(
        { error: 'Error al cancelar la solicitud: ' + updateError.message },
        { status: 500 }
      );
    }

    if (!updateData || updateData.length === 0) {
      console.error('⚠️ UPDATE no afectó ninguna fila - posible problema de RLS');
      return NextResponse.json(
        { error: 'No se pudo actualizar la solicitud. Verifica los permisos.' },
        { status: 403 }
      );
    }

    // Registrar en el historial
    const { error: historialError } = await supabase
      .from('solicitud_historial')
      .insert({
        solicitud_id: solicitudId,
        estado_anterior: solicitud.status,
        estado_nuevo: 'cancelado',
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email,
        user_role: 'Creador',
        comentario: `Solicitud cancelada. Motivo: ${motivo}`
      });

    if (historialError) {
      console.error('Error al registrar historial:', historialError);
    }

    // Registrar en modificaciones si la solicitud tiene centro
    if (solicitud.center_id) {
      const { error: modError } = await supabase
        .from('modificaciones')
        .insert({
          centro_id: solicitud.center_id,
          tipo: 'solicitud',
          accion: 'cancelar',
          descripcion: `Solicitud #${solicitudId.slice(0, 8)} cancelada. Motivo: ${motivo}`,
          usuario_id: user.id,
          usuario_nombre: user.user_metadata?.full_name || user.email,
          metadata: {
            solicitud_id: solicitudId,
            estado_anterior: solicitud.status,
            estado_nuevo: 'cancelado',
            motivo: motivo
          }
        });

      if (modError) {
        console.error('Error al registrar modificación:', modError);
      }
    }

    // Crear notificación para el centro usando el mismo patrón que en creación
    if (solicitud.center_id) {
      try {
        const adminClient = createAdminClient();
        
        // Obtener grupos de notificación del centro
        const { data: notificationGroups, error: groupsError } = await adminClient
          .from('user_groups')
          .select('id, nombre')
          .eq('centro_id', solicitud.center_id)
          .eq('tipo', 'notificacion')
          .eq('activo', true);

        console.log('📢 [Cancelar] Grupos de notificación encontrados:', notificationGroups?.length || 0);
        if (groupsError) {
          console.error('❌ [Cancelar] Error buscando grupos:', groupsError);
        }

        if (notificationGroups && notificationGroups.length > 0) {
          // Obtener miembros de todos los grupos
          const groupIds = notificationGroups.map(g => g.id);
          const { data: members, error: membersError } = await adminClient
            .from('user_group_members')
            .select('user_id, group_id')
            .in('group_id', groupIds);

          console.log('👥 [Cancelar] Miembros encontrados:', members?.length || 0);
          if (membersError) {
            console.error('❌ [Cancelar] Error buscando miembros:', membersError);
          }

          if (members && members.length > 0) {
            // Recopilar user_ids únicos
            const userIds = new Set<string>();
            members.forEach(member => {
              userIds.add(member.user_id);
            });
            
            console.log('👥 [Cancelar] Usuarios únicos a notificar:', Array.from(userIds));

            const notifications = Array.from(userIds).map(userId => ({
              user_id: userId,
              type: 'warning' as const,
              title: 'Solicitud Cancelada',
              message: `La solicitud "${solicitud.title || solicitud.nombre_proyecto}" ha sido cancelada. Motivo: ${motivo}`,
              link: `/center/${solicitud.center?.slug}/solicitudes/${solicitudId}`,
              center_name: solicitud.center?.name || null,
              read: false
            }));

            console.log('📨 [Cancelar] Creando notificaciones para:', notifications.length, 'usuarios');

            const { error: notifError } = await adminClient
              .from('notifications')
              .insert(notifications);

            if (notifError) {
              console.error('❌ [Cancelar] Error al crear notificaciones:', notifError);
            } else {
              console.log('✅ [Cancelar] Notificaciones creadas exitosamente');
            }
          }
        }
      } catch (notifError) {
        console.error('❌ [Cancelar] Error en sistema de notificaciones:', notifError);
        // No fallar la cancelación si falla la notificación
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitud cancelada exitosamente'
    });

  } catch (error) {
    console.error('Error en PATCH /api/solicitudes/[id]/cancelar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
