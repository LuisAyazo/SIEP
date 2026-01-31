import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/google/disconnect
 * Desconecta Google Calendar eliminando los tokens
 */
export async function POST(request: NextRequest) {
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

    // Eliminar tokens de Google
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        google_access_token: null,
        google_refresh_token: null,
        google_token_expiry: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error al eliminar tokens:', updateError);
      return NextResponse.json(
        { error: 'Error al desconectar Google Calendar' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Google Calendar desconectado exitosamente' 
    });

  } catch (error) {
    console.error('Error al desconectar Google:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
