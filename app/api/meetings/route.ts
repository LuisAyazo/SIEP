import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCalendarEvent } from '@/lib/google-calendar/client';

// GET /api/meetings - Listar reuniones del centro del usuario
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

    // Obtener parámetros de búsqueda
    const searchParams = request.nextUrl.searchParams;
    const centerId = searchParams.get('center_id');
    const status = searchParams.get('status');
    const meetingType = searchParams.get('meeting_type');
    const futureOnly = searchParams.get('future_only'); // Nuevo parámetro

    // Construir query base
    let query = supabase
      .from('meetings')
      .select(`
        *,
        center:centers(id, name, slug),
        created_by_user:profiles!created_by(id, email, full_name),
        meeting_participants(
          id,
          role,
          attendance_status,
          user:profiles(id, email, full_name)
        )
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (centerId) {
      query = query.eq('center_id', centerId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (meetingType) {
      query = query.eq('meeting_type', meetingType);
    }

    // Filtrar solo comités futuros (desde hoy en adelante)
    if (futureOnly === 'true') {
      const now = new Date().toISOString();
      query = query.gte('scheduled_at', now);
    }

    const { data: meetings, error } = await query;

    if (error) {
      console.error('Error al obtener reuniones:', error);
      return NextResponse.json(
        { error: 'Error al obtener reuniones' },
        { status: 500 }
      );
    }

    return NextResponse.json({ meetings }, { status: 200 });

  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/meetings - Crear nueva reunión
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

    // Verificar que el usuario tiene permisos para crear reuniones
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('roles!inner(name)')
      .eq('user_id', user.id);

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const canCreateMeetings = roles.some((role: string) => 
      ['administrador', 'director_centro', 'coordinador_centro'].includes(role)
    );

    if (!canCreateMeetings) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear reuniones' },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const {
      title,
      description,
      scheduled_at,
      duration_minutes = 60,
      center_id,
      meeting_platform,
      meeting_url,
      participant_ids = [],
      external_emails = []
    } = body;

    // Validar campos requeridos
    if (!title || !scheduled_at || !center_id) {
      return NextResponse.json(
        { error: 'Campos requeridos: title, scheduled_at, center_id' },
        { status: 400 }
      );
    }

    // Crear reunión
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        title,
        description,
        scheduled_at,
        duration_minutes,
        center_id,
        meeting_platform,
        meeting_url,
        created_by: user.id,
        status: 'scheduled'
      })
      .select()
      .single();

    if (meetingError) {
      console.error('Error al crear reunión:', meetingError);
      return NextResponse.json(
        { error: 'Error al crear reunión' },
        { status: 500 }
      );
    }

    // Agregar creador como organizador
    await supabase
      .from('meeting_participants')
      .insert({
        meeting_id: meeting.id,
        user_id: user.id,
        role: 'organizer',
        attendance_status: 'accepted'
      });

    // Agregar participantes si fueron proporcionados
    if (participant_ids.length > 0) {
      console.log('[Meetings POST] Agregando participantes:', {
        count: participant_ids.length,
        ids: participant_ids,
        meetingId: meeting.id
      });

      const participants = participant_ids.map((userId: string) => ({
        meeting_id: meeting.id,
        user_id: userId,
        role: 'participant',
        attendance_status: 'invited'
      }));

      const { data: insertedParticipants, error: participantsError } = await supabase
        .from('meeting_participants')
        .insert(participants)
        .select();

      if (participantsError) {
        console.error('[Meetings POST] Error al insertar participantes:', participantsError);
      } else {
        console.log('[Meetings POST] Participantes insertados exitosamente:', insertedParticipants?.length);
      }
    } else {
      console.log('[Meetings POST] No se proporcionaron participant_ids');
    }

    // Agregar participantes externos si fueron proporcionados
    if (external_emails && external_emails.length > 0) {
      console.log('[Meetings POST] Agregando participantes externos:', {
        count: external_emails.length,
        emails: external_emails,
        meetingId: meeting.id
      });

      const externalParticipants = external_emails.map((email: string) => ({
        meeting_id: meeting.id,
        user_id: null,
        external_email: email,
        role: 'participant',
        attendance_status: 'invited'
      }));

      const { data: insertedExternal, error: externalError } = await supabase
        .from('meeting_participants')
        .insert(externalParticipants)
        .select();

      if (externalError) {
        console.error('[Meetings POST] Error al insertar participantes externos:', externalError);
      } else {
        console.log('[Meetings POST] Participantes externos insertados:', insertedExternal?.length);
      }
    } else {
      console.log('[Meetings POST] No se proporcionaron external_emails');
    }

    // Intentar sincronizar con Google Calendar si el usuario tiene tokens
    let googleEventId: string | null = null;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('google_access_token, google_refresh_token, email')
        .eq('id', user.id)
        .single();

      if (profile?.google_access_token) {
        // Obtener emails de los participantes internos
        const { data: participants } = await supabase
          .from('meeting_participants')
          .select('user:profiles(email)')
          .eq('meeting_id', meeting.id);

        const internalEmails = participants?.map((p: any) => p.user?.email).filter(Boolean) || [];
        
        // Combinar emails internos y externos
        const attendeeEmails = [...internalEmails, ...external_emails];

        // Calcular fecha de fin
        const startDate = new Date(scheduled_at);
        const endDate = new Date(startDate.getTime() + duration_minutes * 60000);

        // Crear descripción SIN link (el link va en location y Google Meet)
        const eventDescription = description || '';

        // Crear evento en Google Calendar
        const googleEvent = await createCalendarEvent(
          profile.google_access_token,
          profile.google_refresh_token,
          {
            summary: title,
            description: eventDescription,
            location: '', // No poner link en location tampoco
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            attendees: attendeeEmails,
          }
        );

        googleEventId = googleEvent.id || null;

        // Extraer link de Google Meet si fue generado
        const meetLink = googleEvent.hangoutLink || googleEvent.conferenceData?.entryPoints?.find(
          (ep: any) => ep.entryPointType === 'video'
        )?.uri;

        // Guardar el ID del evento y el link de Meet
        const updateData: any = { google_calendar_event_id: googleEventId };
        if (meetLink && !meeting_url) {
          updateData.meeting_url = meetLink;
          console.log('✅ Link de Google Meet generado:', meetLink);
        }

        if (googleEventId) {
          await supabase
            .from('meetings')
            .update(updateData)
            .eq('id', meeting.id);
        }

        console.log('✅ Evento sincronizado con Google Calendar:', googleEventId);
      }
    } catch (calendarError) {
      // No fallar si hay error con Google Calendar, solo registrar
      console.error('⚠️ Error al sincronizar con Google Calendar:', calendarError);
    }

    // Obtener reunión completa con relaciones
    const { data: fullMeeting } = await supabase
      .from('meetings')
      .select(`
        *,
        center:centers(id, name, slug),
        created_by_user:profiles!meetings_created_by_fkey(id, email, full_name),
        meeting_participants(
          id,
          role,
          attendance_status,
          user:profiles(id, email, full_name)
        )
      `)
      .eq('id', meeting.id)
      .single();

    return NextResponse.json(
      {
        meeting: fullMeeting,
        message: 'Reunión creada exitosamente',
        google_synced: !!googleEventId
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}