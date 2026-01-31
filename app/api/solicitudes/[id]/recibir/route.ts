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
    console.log('🔍 DEBUG - Buscando solicitud:', solicitudId);
    const { data: solicitud, error: fetchError } = await supabase
      .from('solicitudes')
      .select('*, center:centers!solicitudes_center_id_fkey(id, name)')
      .eq('id', solicitudId)
      .single();

    console.log('🔍 DEBUG - Solicitud encontrada:', solicitud);
    console.log('🔍 DEBUG - Error al buscar:', fetchError);

    if (fetchError || !solicitud) {
      console.log('❌ Solicitud no encontrada o error RLS');
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario pertenece al centro
    console.log('🔍 DEBUG - Verificando acceso al centro');
    console.log('🔍 DEBUG - User ID:', user.id);
    console.log('🔍 DEBUG - Center ID:', solicitud.center_id);
    
    const { data: userCenter, error: centerError } = await supabase
      .from('user_centers')
      .select('center_id')
      .eq('user_id', user.id)
      .eq('center_id', solicitud.center_id)
      .single();

    console.log('🔍 DEBUG - User Center:', userCenter);
    console.log('🔍 DEBUG - Center Error:', centerError);

    if (!userCenter) {
      return NextResponse.json(
        { error: 'No tienes acceso a este centro' },
        { status: 403 }
      );
    }

    // Verificar que el usuario es director o administrador
    console.log('🔍 DEBUG - Verificando roles del usuario');
    
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id);

    console.log('🔍 DEBUG - User Roles Data:', JSON.stringify(userRoles, null, 2));
    console.log('🔍 DEBUG - Roles Error:', rolesError);

    const roles = userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];
    console.log('🔍 DEBUG - Extracted Roles:', roles);
    
    const canReceive = roles.includes('director') || roles.includes('administrador');
    console.log('🔍 DEBUG - Can Receive:', canReceive);

    if (!canReceive) {
      return NextResponse.json(
        { error: 'Solo el director o administrador del centro puede recibir solicitudes' },
        { status: 403 }
      );
    }

    // Verificar que el estado actual es 'nuevo'
    if (solicitud.status !== 'nuevo') {
      return NextResponse.json(
        { error: `No se puede recibir una solicitud en estado '${solicitud.status}'` },
        { status: 400 }
      );
    }

    // Validar transición usando función SQL
    const { data: validacion, error: validacionError } = await supabase
      .rpc('validar_transicion_estado', {
        p_estado_actual: solicitud.status,
        p_estado_nuevo: 'recibido',
        p_user_id: user.id
      });

    console.log('🔍 DEBUG - Validación:', validacion);
    console.log('🔍 DEBUG - Validación Error:', validacionError);

    if (validacionError || !validacion) {
      console.log('❌ Transición no válida');
      return NextResponse.json(
        { error: 'Transición de estado no válida' },
        { status: 400 }
      );
    }

    // Obtener el centro de servicios
    const { data: centroServicios } = await supabase
      .from('centers')
      .select('id, name')
      .eq('slug', 'centro-servicios')
      .single();

    if (!centroServicios) {
      return NextResponse.json(
        { error: 'Centro de servicios no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar estado de la solicitud y asignarla al centro de servicios
    const { data: updatedSolicitud, error: updateError } = await supabase
      .from('solicitudes')
      .update({
        status: 'recibido',
        director_id: user.id,
        assigned_to_center_id: centroServicios.id,
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

    // El trigger ya creó un registro en el historial, ahora lo actualizamos con el comentario personalizado
    // Buscar el registro más reciente del historial para esta solicitud
    const { data: historialReciente } = await supabase
      .from('solicitud_historial')
      .select('id')
      .eq('solicitud_id', solicitudId)
      .eq('estado_nuevo', 'recibido')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (historialReciente) {
      // Obtener el metadata actual y combinarlo con la nueva información
      const { data: historialActual } = await supabase
        .from('solicitud_historial')
        .select('metadata')
        .eq('id', historialReciente.id)
        .single();

      const metadataActual = historialActual?.metadata || {};

      await supabase
        .from('solicitud_historial')
        .update({
          comentario: `Solicitud aceptada y enviada a ${centroServicios.name}`,
          metadata: {
            ...metadataActual,
            center_name: solicitud.center?.name || 'Centro desconocido',
            assigned_to_center_name: centroServicios.name
          }
        })
        .eq('id', historialReciente.id);
    }

    // Enviar notificaciones a los usuarios del centro de servicios
    const { data: grupoNotificacion } = await supabase
      .from('user_groups')
      .select('id, nombre')
      .eq('centro_id', centroServicios.id)
      .eq('tipo', 'notificacion')
      .eq('activo', true)
      .single();

    if (grupoNotificacion) {
      // Obtener miembros del grupo
      const { data: miembrosGrupo } = await supabase
        .from('user_group_members')
        .select('user_id')
        .eq('group_id', grupoNotificacion.id);

      // Crear notificaciones para cada miembro
      if (miembrosGrupo && miembrosGrupo.length > 0) {
        const notificaciones = miembrosGrupo.map(miembro => ({
          user_id: miembro.user_id,
          type: 'info',
          title: 'Nueva solicitud recibida',
          message: `La solicitud #${solicitudId.substring(0, 8)} ha sido enviada a ${centroServicios.name}`,
          link: `/center/centro-servicios/solicitudes/${solicitudId}`,
          read: false
        }));

        await supabase.from('notifications').insert(notificaciones);
        console.log(`📧 Notificaciones enviadas a ${miembrosGrupo.length} usuarios del ${centroServicios.name}`);
      }
    }

    return NextResponse.json({
      success: true,
      solicitud: updatedSolicitud,
      message: 'Solicitud enviada exitosamente al centro de servicios'
    });

  } catch (error) {
    console.error('Error en PATCH /api/solicitudes/[id]/recibir:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}