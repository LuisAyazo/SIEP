/**
 * API Route para upload de archivos Excel
 * 
 * POST /api/upload/excel - Subir archivo Excel a Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls']
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
]

/**
 * POST /api/upload/excel
 * Sube un archivo Excel a Supabase Storage
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

    // Obtener el archivo del FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const centerId = formData.get('center_id') as string
    const solicitudId = formData.get('solicitud_id') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    if (!centerId) {
      return NextResponse.json(
        { error: 'Se requiere el center_id' },
        { status: 400 }
      )
    }

    // Validar tamaño del archivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const fileName = file.name.toLowerCase()
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'))
    
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Solo se permiten archivos Excel (.xlsx, .xls)' },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido' },
        { status: 400 }
      )
    }

    // Verificar que el usuario tenga acceso al centro
    const { data: userCenter } = await supabase
      .from('user_centers')
      .select('center_id')
      .eq('user_id', user.id)
      .eq('center_id', centerId)
      .single()

    if (!userCenter) {
      return NextResponse.json(
        { error: 'No tienes acceso a este centro' },
        { status: 403 }
      )
    }

    // Obtener slug del centro para la ruta
    const { data: center } = await supabase
      .from('centers')
      .select('slug, name')
      .eq('id', centerId)
      .single()

    if (!center) {
      return NextResponse.json(
        { error: 'Centro no encontrado' },
        { status: 404 }
      )
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const uniqueId = solicitudId || `temp-${timestamp}`
    const sanitizedFileName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.-]/g, '_')
    
    const storagePath = `programa-proyectos-convenios/${center.slug}/${uniqueId}/${sanitizedFileName}`

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('solicitudes-documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('[API] Error al subir archivo:', uploadError)
      
      // Si el archivo ya existe, intentar con nombre único
      if (uploadError.message.includes('already exists')) {
        const newPath = `programa-proyectos-convenios/${center.slug}/${uniqueId}/${timestamp}-${sanitizedFileName}`
        const { data: retryData, error: retryError } = await supabase.storage
          .from('solicitudes-documents')
          .upload(newPath, buffer, {
            contentType: file.type,
            upsert: false
          })

        if (retryError) {
          return NextResponse.json(
            { error: 'Error al subir archivo', details: retryError.message },
            { status: 500 }
          )
        }

        // Obtener URL pública o firmada
        const { data: urlData } = supabase.storage
          .from('solicitudes-documents')
          .getPublicUrl(retryData.path)

        return NextResponse.json({
          message: 'Archivo subido exitosamente',
          file: {
            path: retryData.path,
            name: file.name,
            size: file.size,
            type: file.type,
            url: urlData.publicUrl
          }
        }, { status: 201 })
      }

      return NextResponse.json(
        { error: 'Error al subir archivo', details: uploadError.message },
        { status: 500 }
      )
    }

    // Obtener URL pública o firmada
    const { data: urlData } = supabase.storage
      .from('solicitudes-documents')
      .getPublicUrl(uploadData.path)

    return NextResponse.json({
      message: 'Archivo subido exitosamente',
      file: {
        path: uploadData.path,
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl
      }
    }, { status: 201 })

  } catch (error) {
    console.error('[API] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/upload/excel
 * Obtener información sobre el bucket de storage
 */
export async function GET() {
  return NextResponse.json({
    bucket: 'solicitudes-documents',
    max_file_size: MAX_FILE_SIZE,
    max_file_size_mb: MAX_FILE_SIZE / 1024 / 1024,
    allowed_extensions: ALLOWED_EXTENSIONS,
    allowed_mime_types: ALLOWED_MIME_TYPES
  })
}