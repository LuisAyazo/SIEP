import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOAuth2Client, getTokensFromCode } from '@/lib/google-calendar/client';
import { google } from 'googleapis';

/**
 * GET /api/google/callback
 * Callback de OAuth2 de Google Calendar
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');

    // Parsear el state para obtener userId y returnUrl
    let userId: string = '';
    let returnUrl = '/settings/integrations';
    
    try {
      const state = JSON.parse(stateParam || '{}');
      userId = state.userId || '';
      returnUrl = state.returnUrl || returnUrl;
    } catch (e) {
      // Si falla el parse, asumir que state es solo el userId (compatibilidad)
      userId = stateParam || '';
    }

    if (error) {
      console.error('Error en OAuth:', error);
      return NextResponse.redirect(
        new URL(`${returnUrl}?google_error=access_denied`, request.url)
      );
    }

    if (!code || !userId) {
      return NextResponse.redirect(
        new URL(`${returnUrl}?google_error=missing_params`, request.url)
      );
    }

    const supabase = await createClient();
    
    // Verificar que el usuario autenticado coincide con el userId del state
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.redirect(
        new URL(`${returnUrl}?google_error=unauthorized`, request.url)
      );
    }

    // Intercambiar código por tokens
    const oauth2Client = createOAuth2Client();
    const tokens = await getTokensFromCode(oauth2Client, code);

    if (!tokens.access_token) {
      throw new Error('No se recibió access token');
    }

    // Verificar que el email de Google sea de unicartagena.edu.co
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.email || !userInfo.email.endsWith('@unicartagena.edu.co')) {
      console.error('Email no autorizado:', userInfo.email);
      return NextResponse.redirect(
        new URL(`${returnUrl}?google_error=invalid_domain`, request.url)
      );
    }

    // Verificar que el email de Google coincida con el email del usuario en el sistema
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (profile?.email !== userInfo.email) {
      console.error('Email no coincide. Sistema:', profile?.email, 'Google:', userInfo.email);
      return NextResponse.redirect(
        new URL(`${returnUrl}?google_error=email_mismatch`, request.url)
      );
    }

    // Guardar tokens en la base de datos
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error al guardar tokens:', updateError);
      return NextResponse.redirect(
        new URL(`${returnUrl}?google_error=save_failed`, request.url)
      );
    }

    // Redirigir a la URL de retorno con éxito
    return NextResponse.redirect(
      new URL(`${returnUrl}?google_success=true`, request.url)
    );

  } catch (error) {
    console.error('Error en callback de Google:', error);
    // Intentar usar returnUrl del state si está disponible
    const returnUrl = '/settings/integrations';
    return NextResponse.redirect(
      new URL(`${returnUrl}?google_error=unknown`, request.url)
    );
  }
}
