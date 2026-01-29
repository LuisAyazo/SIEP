import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
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

    // Obtener la solicitud con sus paths de documentos
    const { data: solicitud, error: solicitudError } = await supabase
      .from('solicitudes')
      .select('ficha_tecnica_path, formato_003_path, contrato_path, convenio_path, solicitud_coordinadores_path, disminucion_gasto_path, acta_comite_path, resolucion_path')
      .eq('id', solicitudId)
      .single();

    if (solicitudError) {
      console.error('Error obteniendo solicitud:', solicitudError);
      return NextResponse.json(
        { error: 'Error al obtener la solicitud' },
        { status: 500 }
      );
    }

    // Construir array de documentos desde los paths
    const documentos = [];
    
    const documentoMap: Record<string, { nombre: string; tipo: string; requerido: boolean }> = {
      ficha_tecnica_path: { nombre: 'Ficha Técnica', tipo: 'Excel', requerido: false },
      formato_003_path: { nombre: 'Formato 003', tipo: 'PDF', requerido: true },
      contrato_path: { nombre: 'Contrato', tipo: 'PDF', requerido: false },
      convenio_path: { nombre: 'Convenio', tipo: 'PDF', requerido: false },
      solicitud_coordinadores_path: { nombre: 'Solicitud Coordinadores', tipo: 'PDF', requerido: false },
      disminucion_gasto_path: { nombre: 'Disminución de Gasto', tipo: 'PDF', requerido: false },
      acta_comite_path: { nombre: 'Acta de Comité', tipo: 'PDF', requerido: false },
      resolucion_path: { nombre: 'Resolución', tipo: 'PDF', requerido: false }
    };

    for (const [key, info] of Object.entries(documentoMap)) {
      const path = solicitud[key as keyof typeof solicitud];
      if (path) {
        documentos.push({
          nombre: info.nombre,
          tipo: info.tipo,
          path: path,
          requerido: info.requerido
        });
      }
    }

    return NextResponse.json({
      success: true,
      documentos
    });

  } catch (error) {
    console.error('Error en GET /api/solicitudes/[id]/documentos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}