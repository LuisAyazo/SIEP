/**
 * API Routes para comentarios de solicitudes
 * 
 * GET /api/solicitudes/[id]/comments - Listar comentarios
 * POST /api/solicitudes/[id]/comments - Crear comentario
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/solicitudes/[id]/comments
 * Lista todos los comentarios de una solicitud
 */
export async function GET(
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


    // Verificar que el usuario tenga acceso a la solicitud
    const { data: solicitud, error: solicitudError } = await supabase
      .from('solicitudes')
      .select('id, created_by, center_id')
      .eq('id', id)
      .single()

    if (solicitudError) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos (el usuario es creador o es director del centro)
    if (solicitud.created_by !== user.id) {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)
        .single()

      const roleName = (userRole as any)?.roles?.name

      if (roleName !== 'administrador') {
        return NextResponse.json(
          { error: 'No tienes permiso para ver estos comentarios' },
          { status: 403 }
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
          { error: 'No tienes permiso para ver estos comentarios' },
          { status: 403 }
        )
      }
    }

    // Obtener comentarios
    const { data: comments, error } = await supabase
      .from('solicitud_comments')
      .select(`
        *,
        user:profiles!solicitud_comments_user_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('solicitud_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[API] Error al obtener comentarios:', error)
      return NextResponse.json(
        { error: 'Error al obtener comentarios', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ comments })

  } catch (error) {
    console.error('[API] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/solicitudes/[id]/comments
 * Crea un nuevo comentario en una solicitud
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

    const body = await request.json()
    const { comment, comment_type = 'aclaracion', attachments } = body

    // Validaciones
    if (!comment) {
      return NextResponse.json(
        { error: 'El comentario es requerido' },
        { status: 400 }
      )
    }

    if (!['aprobacion', 'rechazo', 'revision', 'aclaracion'].includes(comment_type)) {
      return NextResponse.json(
        { error: 'Tipo de comentario inválido' },
        { status: 400 }
      )
    }

    // Verificar que la solicitud existe
    const { data: solicitud, error: solicitudError } = await supabase
      .from('solicitudes')
      .select('id, created_by, center_id')
      .eq('id', id)
      .single()

    if (solicitudError) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos
    if (solicitud.created_by !== user.id) {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)
        .single()

      const roleName = (userRole as any)?.roles?.name

      if (roleName !== 'administrador') {
        return NextResponse.json(
          { error: 'No tienes permiso para comentar en esta solicitud' },
          { status: 403 }
        )
      }

      const { data: userCenter } = await supabase
        .from('user_centers')
        .select('center_id')
        .eq('user_id', user.id)
        .eq('center_id', solicitud.center_id)
        .single()

      if (!userCenter) {
        return NextResponse.json(
          { error: 'No tienes permiso para comentar en esta solicitud' },
          { status: 403 }
        )
      }
    }

    // Crear comentario
    const { data: newComment, error } = await supabase
      .from('solicitud_comments')
      .insert({
        solicitud_id: id,
        user_id: user.id,
        comment,
        comment_type,
        attachments: attachments || null
      })
      .select(`
        *,
        user:profiles!solicitud_comments_user_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .single()

    if (error) {
      console.error('[API] Error al crear comentario:', error)
      return NextResponse.json(
        { error: 'Error al crear comentario', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Comentario creado exitosamente',
      comment: newComment
    }, { status: 201 })

  } catch (error) {
    console.error('[API] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}