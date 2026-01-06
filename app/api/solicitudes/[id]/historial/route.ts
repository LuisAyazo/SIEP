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

    // Obtener historial con información del usuario
    const { data: historial, error: historialError } = await supabase
      .from('solicitud_historial')
      .select(`
        *,
        user:user_id (
          id,
          email,
          raw_user_meta_data
        )
      `)
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
    const formattedHistorial = (historial || []).map((item: any) => ({
      id: item.id,
      estado_anterior: item.estado_anterior,
      estado_nuevo: item.estado_nuevo,
      user_name: item.user?.raw_user_meta_data?.full_name || item.user?.email || 'Usuario',
      user_role: 'Usuario', // TODO: Obtener rol real
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