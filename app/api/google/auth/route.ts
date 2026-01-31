import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOAuth2Client, getAuthUrl } from '@/lib/google-calendar/client';

/**
 * GET /api/google/auth
 * Inicia el flujo de autenticación con Google Calendar
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

    // Crear cliente OAuth2
    const oauth2Client = createOAuth2Client();
    
    // Obtener la URL de retorno desde los query params
    const returnUrl = request.nextUrl.searchParams.get('returnUrl');
    
    // Crear state con el user ID y la URL de retorno
    const state = JSON.stringify({
      userId: user.id,
      returnUrl: returnUrl || '/settings/integrations'
    });
    
    // Generar URL de autorización
    const authUrl = getAuthUrl(oauth2Client, state);

    return NextResponse.json({ authUrl });

  } catch (error) {
    console.error('Error al generar URL de autenticación:', error);
    return NextResponse.json(
      { error: 'Error al iniciar autenticación con Google' },
      { status: 500 }
    );
  }
}
