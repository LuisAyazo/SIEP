/**
 * API Routes para operaciones con solicitud individual
 * 
 * GET /api/solicitudes/[id] - Ver solicitud
 * PATCH /api/solicitudes/[id] - Actualizar solicitud
 * DELETE /api/solicitudes/[id] - Eliminar solicitud
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/solicitudes/[id]
 * Obtiene los detalles de una solicitud específica
 */
export async function GET(
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

    const { id } = params

    // Obtener solicitud con relaciones
    const { data: solicitud, error } = await supabase
      .from('solicitudes')
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
        ),
        assigned_to_profile:profiles!solicitudes_assigned_to_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Solicitud no encontrada' },
          { status: 404 }
        )
      }
      
      console.error('[API] Error al obtener solicitud:', error)
      return NextResponse.json(
        { error: 'Error al obtener solicitud', details: error.message },
        { status: 500 }
      )
    }

    // Verificar permisos (RLS se encarga de esto también)
    if (solicitud.created_by !== user.id) {
      // Verificar si es director del centro
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)
        .single()

      const roleName = (userRole as any)?.roles?.name
      
      if (roleName !== 'administrador') {
        return NextResponse.json(
          { error: 'No tienes permiso para ver esta solicitud' },
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
          { error: 'No tienes permiso para ver esta solicitud' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ solicitud })

  } catch (error) {
    console.error('[API] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/solicitudes/[id]
 * Actualiza una solicitud (solo ciertos campos)
 */
export async function PATCH(
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

    const { id } = params
    const body = await request.json()

    // Campos permitidos para actualizar
    const allowedFields = ['title', 'description', 'tipo', 'priority', 'deadline', 'status']
    const updates: any = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    // Agregar timestamp de actualización
    updates.updated_at = new Date().toISOString()

    // Actualizar solicitud
    const { data: solicitud, error } = await supabase
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

    if (error) {
      console.error('[API] Error al actualizar solicitud:', error)
      return NextResponse.json(
        { error: 'Error al actualizar solicitud', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Solicitud actualizada exitosamente',
      solicitud
    })

  } catch (error) {
    console.error('[API] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/solicitudes/[id]
 * Elimina una solicitud (solo si está rechazada o es del usuario)
 */
export async function DELETE(
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

    const { id } = params

    // Obtener solicitud primero
    const { data: solicitud, error: fetchError } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .single()

    const roleName = (userRole as any)?.roles?.name

    // Solo el creador o un director puede eliminar
    if (solicitud.created_by !== user.id && roleName !== 'administrador') {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta solicitud' },
        { status: 403 }
      )
    }

    // Solo se pueden eliminar solicitudes rechazadas o pendientes
    if (!['rechazada', 'pendiente'].includes(solicitud.status)) {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar solicitudes rechazadas o pendientes' },
        { status: 400 }
      )
    }

    // Eliminar solicitud
    const { error: deleteError } = await supabase
      .from('solicitudes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[API] Error al eliminar solicitud:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar solicitud', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Solicitud eliminada exitosamente'
    })

  } catch (error) {
    console.error('[API] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}