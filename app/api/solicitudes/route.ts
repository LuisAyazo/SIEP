/**
 * API Routes para Solicitudes (Fichas Técnicas)
 * 
 * GET /api/solicitudes - Listar solicitudes
 * POST /api/solicitudes - Crear solicitud
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Tipos
interface SolicitudFilters {
  status?: string
  centro_id?: string
  created_by?: string
  priority?: string
  search?: string
}

/**
 * GET /api/solicitudes
 * Lista solicitudes según el rol del usuario
 * - Funcionarios: solo sus propias solicitudes
 * - Directores: solicitudes de su centro
 */
export async function GET(request: NextRequest) {
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

    // Obtener parámetros de búsqueda
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const centerId = searchParams.get('center_id')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Obtener rol del usuario
    const { data: userRole } = await supabase
      .from('user_roles')
      .select(`
        roles (
          name
        )
      `)
      .eq('user_id', user.id)
      .single()

    const roleName = (userRole as any)?.roles?.name

    // Construir query base
    let query = supabase
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
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Aplicar filtros según el rol
    if (roleName === 'funcionario') {
      // Funcionarios solo ven sus propias solicitudes
      query = query.eq('created_by', user.id)
    } else if (roleName === 'administrador') {
      // Directores ven solicitudes de su centro
      const { data: userCenters } = await supabase
        .from('user_centers')
        .select('center_id')
        .eq('user_id', user.id)

      if (userCenters && userCenters.length > 0) {
        const centerIds = userCenters.map(uc => uc.center_id)
        query = query.in('center_id', centerIds)
      }
    }

    // Aplicar filtros adicionales
    if (status) {
      query = query.eq('status', status)
    }

    if (centerId) {
      query = query.eq('center_id', centerId)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Paginación
    query = query.range(offset, offset + limit - 1)

    const { data: solicitudes, error, count } = await query

    if (error) {
      console.error('[API] Error al obtener solicitudes:', error)
      return NextResponse.json(
        { error: 'Error al obtener solicitudes', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      solicitudes,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
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
 * POST /api/solicitudes
 * Crea una nueva solicitud
 */
export async function POST(request: NextRequest) {
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

    // Obtener datos del body
    const body = await request.json()
    const {
      title,
      description,
      tipo,
      center_id,
      file_url,
      file_name,
      file_size,
      priority = 'normal',
      deadline
    } = body

    // Validaciones
    if (!title || !center_id || !file_url || !file_name) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: title, center_id, file_url, file_name' },
        { status: 400 }
      )
    }

    // Verificar que el usuario tenga acceso al centro
    const { data: userCenter } = await supabase
      .from('user_centers')
      .select('center_id')
      .eq('user_id', user.id)
      .eq('center_id', center_id)
      .single()

    if (!userCenter) {
      return NextResponse.json(
        { error: 'No tienes acceso a este centro' },
        { status: 403 }
      )
    }

    // Buscar director del centro para asignar
    const { data: adminUser } = await supabase
      .from('user_centers')
      .select(`
        user_id,
        user_roles!inner (
          role_id,
          roles!inner (
            name
          )
        )
      `)
      .eq('center_id', center_id)
      .limit(1)
      .single()

    const assignedTo = (adminUser as any)?.user_roles?.roles?.name === 'administrador' 
      ? (adminUser as any)?.user_id 
      : null

    // Crear solicitud
    const { data: solicitud, error } = await supabase
      .from('solicitudes')
      .insert({
        created_by: user.id,
        center_id,
        assigned_to: assignedTo,
        title,
        description,
        tipo,
        status: 'pendiente',
        file_url,
        file_name,
        file_size,
        priority,
        deadline: deadline || null
      })
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
      console.error('[API] Error al crear solicitud:', error)
      return NextResponse.json(
        { error: 'Error al crear solicitud', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Solicitud creada exitosamente',
      solicitud
    }, { status: 201 })

  } catch (error) {
    console.error('[API] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}