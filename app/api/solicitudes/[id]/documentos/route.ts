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

    // Obtener documentos de la solicitud
    const { data: documentos, error: documentosError } = await supabase
      .from('solicitud_documentos')
      .select('*')
      .eq('solicitud_id', solicitudId)
      .order('created_at', { ascending: true });

    if (documentosError) {
      console.error('Error obteniendo documentos:', documentosError);
      return NextResponse.json(
        { error: 'Error al obtener los documentos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documentos: documentos || []
    });

  } catch (error) {
    console.error('Error en GET /api/solicitudes/[id]/documentos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}