import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/google/status
 * Verifica si el usuario tiene Google Calendar conectado
 */
export async function GET(request: NextRequest) {
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

    // Verificar si tiene tokens de Google
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_access_token, google_refresh_token')
      .eq('id', user.id)
      .single();

    const connected = !!(profile?.google_access_token && profile?.google_refresh_token);

    return NextResponse.json({ connected });

  } catch (error) {
    console.error('Error al verificar estado de Google:', error);
    return NextResponse.json(
      { error: 'Error al verificar estado' },
      { status: 500 }
    );
  }
}
