/**
 * Utilidades para manejo de Supabase Storage
 * Gestión de archivos para solicitudes
 */

import { createClient } from '@/lib/supabase/client'

export interface UploadFileOptions {
  userId: string
  solicitudId: string
  tipoDocumento: string
  file: File
}

export interface UploadResult {
  success: boolean
  path?: string
  url?: string
  error?: string
}

/**
 * Sube un archivo a Supabase Storage
 */
export async function uploadFile({
  userId,
  solicitudId,
  tipoDocumento,
  file,
}: UploadFileOptions): Promise<UploadResult> {
  try {
    const supabase = createClient()

    // Generar path usando la función de BD
    const { data: pathData, error: pathError } = await supabase.rpc(
      'generate_storage_path',
      {
        p_user_id: userId,
        p_solicitud_id: solicitudId,
        p_tipo_documento: tipoDocumento,
        p_filename: file.name,
      }
    )

    if (pathError) {
      console.error('Error generando path:', pathError)
      return {
        success: false,
        error: `Error generando ruta: ${pathError.message}`,
      }
    }

    const filePath = pathData as string

    // Subir archivo
    const { data, error } = await supabase.storage
      .from('solicitudes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Error subiendo archivo:', error)
      return {
        success: false,
        error: `Error subiendo archivo: ${error.message}`,
      }
    }

    // Obtener URL pública (aunque el bucket es privado, necesitamos la referencia)
    const { data: urlData } = supabase.storage
      .from('solicitudes')
      .getPublicUrl(filePath)

    return {
      success: true,
      path: data.path,
      url: urlData.publicUrl,
    }
  } catch (error) {
    console.error('Error en uploadFile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Sube múltiples archivos
 */
export async function uploadMultipleFiles(
  files: UploadFileOptions[]
): Promise<Record<string, UploadResult>> {
  const results: Record<string, UploadResult> = {}

  for (const fileOptions of files) {
    const result = await uploadFile(fileOptions)
    results[fileOptions.tipoDocumento] = result
  }

  return results
}

/**
 * Elimina un archivo de Storage
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage
      .from('solicitudes')
      .remove([filePath])

    if (error) {
      console.error('Error eliminando archivo:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error en deleteFile:', error)
    return false
  }
}

/**
 * Obtiene URL firmada para descargar archivo privado
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from('solicitudes')
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      console.error('Error generando URL firmada:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error en getSignedUrl:', error)
    return null
  }
}

/**
 * Lista archivos de una solicitud
 */
export async function listSolicitudFiles(
  userId: string,
  solicitudId: string
): Promise<string[]> {
  try {
    const supabase = createClient()

    const prefix = `${userId}/${solicitudId}/`

    const { data, error } = await supabase.storage
      .from('solicitudes')
      .list(prefix, {
        limit: 100,
        offset: 0,
      })

    if (error) {
      console.error('Error listando archivos:', error)
      return []
    }

    return data.map((file) => `${prefix}${file.name}`)
  } catch (error) {
    console.error('Error en listSolicitudFiles:', error)
    return []
  }
}