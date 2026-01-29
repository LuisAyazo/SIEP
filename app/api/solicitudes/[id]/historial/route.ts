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

    // Obtener historial sin JOIN (la relación no existe en la BD)
    const { data: historial, error: historialError } = await supabase
      .from('solicitud_historial')
      .select('*')
      .eq('solicitud_id', solicitudId)
      .order('created_at', { ascending: true });

    if (historialError) {
      console.error('Error obteniendo historial:', historialError);
      return NextResponse.json(
        { error: 'Error al obtener el historial' },
        { status: 500 }
      );
    }

    // Formatear historial para el frontend
    // Nota: user_id existe en la tabla pero no hay relación FK,
    // por lo que no podemos hacer JOIN. Usamos el user_id directamente.
    const formattedHistorial = (historial || []).map((item: any) => ({
      id: item.id,
      estado_anterior: item.estado_anterior,
      estado_nuevo: item.estado_nuevo,
      user_name: item.user_name || 'Usuario', // Usar el campo user_name si existe
      user_role: 'Usuario',
      comentario: item.comentario,
      created_at: item.created_at
    }));

    return NextResponse.json({
      success: true,
      historial: formattedHistorial
    });

  } catch (error) {
    console.error('Error en GET /api/solicitudes/[id]/historial:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}