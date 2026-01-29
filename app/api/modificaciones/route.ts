import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener centro_id del query string
    const searchParams = request.nextUrl.searchParams;
    const centroId = searchParams.get('centro_id');

    if (!centroId) {
      return NextResponse.json({ error: 'centro_id es requerido' }, { status: 400 });
    }

    // Obtener modificaciones del centro
    const { data: modificaciones, error } = await supabase
      .from('modificaciones')
      .select('*')
      .eq('centro_id', centroId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener modificaciones:', error);
      return NextResponse.json({ error: 'Error al obtener modificaciones' }, { status: 500 });
    }

    return NextResponse.json({ modificaciones: modificaciones || [] });
  } catch (error) {
    console.error('Error en GET /api/modificaciones:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
