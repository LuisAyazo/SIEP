/**
 * API Route para rechazar solicitudes
 * 
 * POST /api/solicitudes/[id]/reject - Rechazar solicitud
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/solicitudes/[id]/reject
 * Rechaza una solicitud (solo directores)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que sea director
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .single()

    const roleName = (userRole as any)?.roles?.name

    if (roleName !== 'administrador') {
      return NextResponse.json(
        { error: 'Solo los directores pueden rechazar solicitudes' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { reason, comment } = body

    if (!reason && !comment) {
      return NextResponse.json(
        { error: 'Debe proporcionar un motivo de rechazo' },
        { status: 400 }
      )
    }

    // Obtener solicitud
    const { data: solicitud, error: fetchError } = await supabase
      .from('solicitudes')
      .select('*, center:centers(id, name)')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que sea del mismo centro
    const { data: userCenter } = await supabase
      .from('user_centers')
      .select('center_id')
      .eq('user_id', user.id)
      .eq('center_id', solicitud.center_id)
      .single()

    if (!userCenter) {
      return NextResponse.json(
        { error: 'No puedes rechazar solicitudes de otros centros' },
        { status: 403 }
      )
    }

    // Verificar que esté en estado pendiente o en_revision
    if (!['pendiente', 'en_revision'].includes(solicitud.status)) {
      return NextResponse.json(
        { error: `No se puede rechazar una solicitud en estado '${solicitud.status}'` },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // Actualizar estado de la solicitud
    const { data: updatedSolicitud, error: updateError } = await supabase
      .from('solicitudes')
      .update({
        status: 'rechazada',
        reviewed_at: now,
        updated_at: now
      })
      .eq('id', id)
      .select(`
        *,
        created_by_profile:profiles!solicitudes_created_by_fkey (
          id,
          full_name,
          email
        ),
        center:centers!solicitudes_center_id_fkey (
          id,
          name,
          slug
        )
      `)
      .single()

    if (updateError) {
      console.error('[API] Error al rechazar solicitud:', updateError)
      return NextResponse.json(
        { error: 'Error al rechazar solicitud', details: updateError.message },
        { status: 500 }
      )
    }

    // Crear comentario de rechazo
    const { error: commentError } = await supabase
      .from('solicitud_comments')
      .insert({
        solicitud_id: id,
        user_id: user.id,
        comment: reason || comment,
        comment_type: 'rechazo'
      })

    if (commentError) {
      console.error('[API] Error al crear comentario de rechazo:', commentError)
      // No falla la operación completa
    }

    return NextResponse.json({
      message: 'Solicitud rechazada',
      solicitud: updatedSolicitud
    })

  } catch (error) {
    console.error('[API] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}