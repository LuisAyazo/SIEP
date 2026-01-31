import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';

// POST /api/meetings/[id]/sync-responses - Sincronizar respuestas desde Google Calendar
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener reunión con google_calendar_event_id
    const { data: meeting } = await supabase
      .from('meetings')
      .select('google_calendar_event_id, created_by')
      .eq('id', id)
      .single();

    if (!meeting) {
      return NextResponse.json(
        { error: 'Reunión no encontrada' },
        { status: 404 }
      );
    }

    if (!meeting.google_calendar_event_id) {
      return NextResponse.json(
        { error: 'Esta reunión no está sincronizada con Google Calendar' },
        { status: 400 }
      );
    }

    // Obtener tokens de Google del creador
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_access_token, google_refresh_token')
      .eq('id', meeting.created_by)
      .single();

    if (!profile?.google_access_token) {
      return NextResponse.json(
        { error: 'El organizador no tiene Google Calendar conectado' },
        { status: 400 }
      );
    }

    // Crear cliente de Google Calendar
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: profile.google_access_token,
      refresh_token: profile.google_refresh_token,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Obtener evento de Google Calendar
    const event = await calendar.events.get({
      calendarId: 'primary',
      eventId: meeting.google_calendar_event_id,
    });

    if (!event.data.attendees) {
      return NextResponse.json(
        { message: 'No hay participantes en el evento' },
        { status: 200 }
      );
    }

    // Mapear respuestas de Google Calendar a nuestro sistema
    const responseMap: Record<string, string> = {
      'accepted': 'accepted',
      'declined': 'declined',
      'tentative': 'maybe',
      'needsAction': 'invited'
    };

    let updatedCount = 0;

    // Actualizar respuestas de participantes
    for (const attendee of event.data.attendees) {
      if (!attendee.email) continue;

      const status = responseMap[attendee.responseStatus || 'needsAction'] || 'invited';

      // Buscar participante por email (interno o externo)
      const { data: participants } = await supabase
        .from('meeting_participants')
        .select('id, user:profiles(email), external_email')
        .eq('meeting_id', id);

      const participant = participants?.find((p: any) => 
        p.user?.email === attendee.email || p.external_email === attendee.email
      );

      if (participant) {
        const { error: updateError } = await supabase
          .from('meeting_participants')
          .update({ attendance_status: status })
          .eq('id', participant.id);

        if (!updateError) {
          updatedCount++;
          console.log(`✅ Actualizado ${attendee.email}: ${status}`);
        }
      }
    }

    return NextResponse.json({
      message: `Sincronización completada: ${updatedCount} respuestas actualizadas`,
      updatedCount
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error al sincronizar respuestas:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
