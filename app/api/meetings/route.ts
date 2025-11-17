import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      .order('scheduled_at', { ascending: false });

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
      participant_ids = []
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
      const participants = participant_ids.map((userId: string) => ({
        meeting_id: meeting.id,
        user_id: userId,
        role: 'participant',
        attendance_status: 'invited'
      }));

      await supabase
        .from('meeting_participants')
        .insert(participants);
    }

    // Obtener reunión completa con relaciones
    const { data: fullMeeting } = await supabase
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
      .eq('id', meeting.id)
      .single();

    return NextResponse.json(
      { meeting: fullMeeting, message: 'Reunión creada exitosamente' },
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