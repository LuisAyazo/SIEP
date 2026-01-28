/**
 * API Routes para Solicitudes (Fichas Técnicas)
 * 
 * GET /api/solicitudes - Listar solicitudes
 * POST /api/solicitudes - Crear solicitud con documentos
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
 * - Comité: solicitudes asignadas a su grupo
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
    const userOnly = searchParams.get('user_only') === 'true'
    const noCenter = searchParams.get('no_center') === 'true'
    const externalOnly = searchParams.get('external_only') === 'true'
    const tipoSolicitud = searchParams.get('tipo_solicitud')
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
        ),
        comite:user_groups (
          id,
          nombre
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Si se solicita solo solicitudes externas (dirigidas a un centro pero creadas por usuarios externos)
    if (externalOnly && centerId) {
      // Obtener usuarios que pertenecen al centro
      const { data: centerUsers } = await supabase
        .from('user_centers')
        .select('user_id')
        .eq('center_id', centerId)
      
      const centerUserIds = centerUsers?.map(uc => uc.user_id) || []
      
      // Filtrar solicitudes del centro que NO fueron creadas por usuarios del centro
      query = query.eq('center_id', centerId)
      if (centerUserIds.length > 0) {
        query = query.not('created_by', 'in', `(${centerUserIds.join(',')})`)
      }
    }
    // Si se solicita solo solicitudes del usuario sin centro
    else if (userOnly && noCenter) {
      query = query.eq('created_by', user.id).is('center_id', null)
    }
    // Aplicar filtros según el rol
    else if (roleName === 'funcionario' || userOnly) {
      // Funcionarios solo ven sus propias solicitudes
      query = query.eq('created_by', user.id)
    } else if (roleName === 'director' || roleName === 'administrador') {
      // Directores ven solicitudes de su centro
      const { data: userCenters } = await supabase
        .from('user_centers')
        .select('center_id')
        .eq('user_id', user.id)

      if (userCenters && userCenters.length > 0) {
        const centerIds = userCenters.map(uc => uc.center_id)
        query = query.in('center_id', centerIds)
      }
    } else {
      // Verificar si es miembro de algún comité
      const { data: userGroups } = await supabase
        .from('user_group_members')
        .select('group_id')
        .eq('user_id', user.id)

      if (userGroups && userGroups.length > 0) {
        const groupIds = userGroups.map(ug => ug.group_id)
        query = query.in('comite_id', groupIds)
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

    if (tipoSolicitud) {
      query = query.eq('tipo_solicitud', tipoSolicitud)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,nombre_proyecto.ilike.%${search}%`)
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
 * Crea una nueva solicitud con documentos
 * Espera FormData con:
 * - tipo_solicitud
 * - center_id
 * - metodo_ficha_tecnica ('importar' | 'formulario')
 * - excel_file (si metodo = 'importar')
 * - excel_data (JSON string con datos validados del Excel)
 * - documentos (archivos adjuntos según tipo)
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

    // Obtener FormData
    const formData = await request.formData()
    
    const tipoSolicitud = formData.get('tipo_solicitud') as string
    const centerIdRaw = formData.get('center_id') as string | null
    // Normalizar centerId: tratar cadenas vacías como null
    const centerId = centerIdRaw && centerIdRaw.trim() !== '' ? centerIdRaw : null
    const metodoFichaTecnica = formData.get('metodo_ficha_tecnica') as string
    const excelDataStr = formData.get('excel_data') as string
    const titulo = formData.get('titulo') as string
    const descripcion = formData.get('descripcion') as string
    const prioridad = formData.get('prioridad') as string
    
    // Validaciones básicas
    if (!tipoSolicitud) {
      return NextResponse.json(
        { error: 'Falta campo requerido: tipo_solicitud' },
        { status: 400 }
      )
    }

    // Validar tipo de solicitud
    const tiposValidos = ['diplomado_proyeccion_social', 'diplomado_extension', 'contrato', 'convenio']
    if (!tiposValidos.includes(tipoSolicitud)) {
      return NextResponse.json(
        { error: 'Tipo de solicitud inválido' },
        { status: 400 }
      )
    }

    // Verificar que el centro existe (si se proporciona center_id)
    // Ya no verificamos si el usuario tiene acceso, permitimos que cualquier usuario
    // pueda enviar solicitudes a cualquier centro
    if (centerId) {
      const { data: centerExists } = await supabase
        .from('centers')
        .select('id')
        .eq('id', centerId)
        .single()

      if (!centerExists) {
        return NextResponse.json(
          { error: 'El centro especificado no existe' },
          { status: 404 }
        )
      }
    }

    // Parsear datos del Excel si existen
    let excelData = null
    let nombreProyecto = null
    
    if (excelDataStr) {
      try {
        excelData = JSON.parse(excelDataStr)
        
        // Extraer nombre del proyecto usando la función de BD
        const { data: projectName, error: nameError } = await supabase.rpc(
          'extract_project_name_from_excel',
          { p_excel_data: excelData }
        )
        
        if (!nameError && projectName) {
          nombreProyecto = projectName
        }
      } catch (e) {
        console.error('Error parseando excel_data:', e)
      }
    }

    // Si no hay nombre de proyecto, generar uno por defecto
    if (!nombreProyecto) {
      nombreProyecto = titulo || `Proyecto_${tipoSolicitud}_${Date.now()}`
    }

    // Buscar director del centro (solo si hay centro)
    let directorId = null
    if (centerId) {
      const { data: directorData } = await supabase
        .from('user_centers')
        .select(`
          user_id,
          profiles!inner (
            id,
            full_name
          )
        `)
        .eq('center_id', centerId)
        .limit(1)

      directorId = directorData && directorData.length > 0
        ? (directorData[0] as any).user_id
        : null
    }

    // Crear solicitud en BD
    const { data: solicitud, error: solicitudError } = await supabase
      .from('solicitudes')
      .insert({
        created_by: user.id,
        center_id: centerId || null,
        director_id: directorId,
        tipo_solicitud: tipoSolicitud,
        nombre_proyecto: nombreProyecto,
        status: 'nuevo',
        title: titulo || `Solicitud ${tipoSolicitud} - ${nombreProyecto}`,
        description: descripcion || `Solicitud de tipo ${tipoSolicitud}`,
        priority: prioridad || 'normal'
      })
      .select('id')
      .single()

    if (solicitudError || !solicitud) {
      console.error('[API] Error creando solicitud:', solicitudError)
      return NextResponse.json(
        { error: 'Error al crear solicitud', details: solicitudError?.message },
        { status: 500 }
      )
    }

    const solicitudId = solicitud.id

    // Subir archivos a Storage
    const uploadResults: Record<string, any> = {}
    const pathsToUpdate: Record<string, string> = {}

    // Función auxiliar para subir archivo
    const uploadFile = async (fieldName: string, file: File) => {
      try {
        // Generar path
        const { data: pathData, error: pathError } = await supabase.rpc(
          'generate_storage_path',
          {
            p_user_id: user.id,
            p_solicitud_id: solicitudId,
            p_tipo_documento: fieldName,
            p_filename: file.name
          }
        )

        if (pathError) {
          throw new Error(`Error generando path: ${pathError.message}`)
        }

        const filePath = pathData as string

        // Subir archivo
        const { data, error } = await supabase.storage
          .from('solicitudes')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          throw new Error(`Error subiendo archivo: ${error.message}`)
        }

        return { success: true, path: data.path }
      } catch (error) {
        console.error(`Error subiendo ${fieldName}:`, error)
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Error desconocido' 
        }
      }
    }

    // Subir Excel si existe
    const excelFile = formData.get('excel_file') as File | null
    if (excelFile) {
      const result = await uploadFile('ficha_tecnica', excelFile)
      uploadResults.ficha_tecnica = result
      if (result.success && result.path) {
        pathsToUpdate.ficha_tecnica_path = result.path
      }
    }

    // Subir Formato 003 (siempre requerido)
    const formato003 = formData.get('formato_003') as File | null
    if (formato003) {
      const result = await uploadFile('formato_003', formato003)
      uploadResults.formato_003 = result
      if (result.success && result.path) {
        pathsToUpdate.formato_003_path = result.path
      }
    }

    // Subir documentos según tipo de solicitud
    if (tipoSolicitud === 'contrato') {
      const contrato = formData.get('contrato') as File | null
      if (contrato) {
        const result = await uploadFile('contrato', contrato)
        uploadResults.contrato = result
        if (result.success && result.path) {
          pathsToUpdate.contrato_path = result.path
        }
      }
    }

    if (tipoSolicitud === 'convenio') {
      const convenio = formData.get('convenio') as File | null
      if (convenio) {
        const result = await uploadFile('convenio', convenio)
        uploadResults.convenio = result
        if (result.success && result.path) {
          pathsToUpdate.convenio_path = result.path
        }
      }
    }

    // Documentos opcionales
    const solicitudCoordinadores = formData.get('solicitud_coordinadores') as File | null
    if (solicitudCoordinadores) {
      const result = await uploadFile('solicitud_coordinadores', solicitudCoordinadores)
      uploadResults.solicitud_coordinadores = result
      if (result.success && result.path) {
        pathsToUpdate.solicitud_coordinadores_path = result.path
      }
    }

    const disminucionGasto = formData.get('disminucion_gasto') as File | null
    if (disminucionGasto) {
      const result = await uploadFile('disminucion_gasto', disminucionGasto)
      uploadResults.disminucion_gasto = result
      if (result.success && result.path) {
        pathsToUpdate.disminucion_gasto_path = result.path
      }
    }

    // Actualizar solicitud con paths de archivos
    if (Object.keys(pathsToUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from('solicitudes')
        .update(pathsToUpdate)
        .eq('id', solicitudId)

      if (updateError) {
        console.error('[API] Error actualizando paths:', updateError)
      }
    }

    // Obtener solicitud completa
    const { data: solicitudCompleta } = await supabase
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
        )
      `)
      .eq('id', solicitudId)
      .single()

    // Enviar notificaciones a los grupos de notificación
    try {
      // Buscar grupos de tipo "notificacion" del centro (si hay centro) o globales
      let notificationGroupsQuery = supabase
        .from('user_groups')
        .select('id, nombre, user_group_members(user_id)')
        .eq('tipo', 'notificacion')
        .eq('activo', true)

      if (centerId) {
        // Buscar grupos del centro específico
        notificationGroupsQuery = notificationGroupsQuery.eq('centro_id', centerId)
      } else {
        // Buscar grupos globales (sin centro asignado)
        notificationGroupsQuery = notificationGroupsQuery.is('centro_id', null)
      }

      const { data: notificationGroups } = await notificationGroupsQuery

      if (notificationGroups && notificationGroups.length > 0) {
        // Recopilar todos los user_ids únicos de los grupos
        const userIds = new Set<string>()
        notificationGroups.forEach(group => {
          if (group.user_group_members) {
            group.user_group_members.forEach((member: any) => {
              userIds.add(member.user_id)
            })
          }
        })

        // Crear notificaciones para cada usuario
        const notifications = Array.from(userIds).map(userId => ({
          user_id: userId,
          title: 'Nueva Solicitud Creada',
          message: `Se ha creado una nueva solicitud: ${nombreProyecto}`,
          type: 'info',
          link: centerId
            ? `/center/${solicitudCompleta?.center?.slug}/solicitudes/${solicitudId}`
            : `/solicitudes/${solicitudId}`,
          read: false
        }))

        if (notifications.length > 0) {
          const { error: notifError } = await supabase
            .from('notifications')
            .insert(notifications)

          if (notifError) {
            console.error('[API] Error creando notificaciones:', notifError)
          } else {
            console.log(`[API] ${notifications.length} notificaciones creadas exitosamente`)
          }
        }
      }
    } catch (notifError) {
      console.error('[API] Error en sistema de notificaciones:', notifError)
      // No fallar la creación de solicitud si falla la notificación
    }

    return NextResponse.json({
      message: 'Solicitud creada exitosamente',
      solicitud: solicitudCompleta,
      uploadResults
    }, { status: 201 })

  } catch (error) {
    console.error('[API] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}