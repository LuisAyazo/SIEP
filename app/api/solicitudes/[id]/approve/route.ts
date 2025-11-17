/**
 * API Route para aprobar solicitudes
 * 
 * POST /api/solicitudes/[id]/approve - Aprobar solicitud
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/solicitudes/[id]/approve
 * Aprueba una solicitud (solo directores)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
        { error: 'Solo los directores pueden aprobar solicitudes' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { comment, send_to_group = false } = body

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
        { error: 'No puedes aprobar solicitudes de otros centros' },
        { status: 403 }
      )
    }

    // Verificar que esté en estado pendiente o en_revision
    if (!['pendiente', 'en_revision'].includes(solicitud.status)) {
      return NextResponse.json(
        { error: `No se puede aprobar una solicitud en estado '${solicitud.status}'` },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // Actualizar estado de la solicitud
    const newStatus = send_to_group ? 'enviada_grupo' : 'aprobada'
    const updates: any = {
      status: newStatus,
      reviewed_at: now,
      updated_at: now
    }

    if (send_to_group) {
      updates.sent_to_group_at = now
    }

    const { data: updatedSolicitud, error: updateError } = await supabase
      .from('solicitudes')
      .update(updates)
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
      console.error('[API] Error al aprobar solicitud:', updateError)
      return NextResponse.json(
        { error: 'Error al aprobar solicitud', details: updateError.message },
        { status: 500 }
      )
    }

    // Crear comentario de aprobación
    if (comment) {
      const { error: commentError } = await supabase
        .from('solicitud_comments')
        .insert({
          solicitud_id: id,
          user_id: user.id,
          comment,
          comment_type: 'aprobacion'
        })

      if (commentError) {
        console.error('[API] Error al crear comentario:', commentError)
        // No falla la operación completa, solo log
      }
    }

    return NextResponse.json({
      message: send_to_group 
        ? 'Solicitud aprobada y enviada al grupo revisor' 
        : 'Solicitud aprobada exitosamente',
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