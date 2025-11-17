import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/meetings/[id]/participants - Agregar participantes a una reunión
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

    // Verificar que la reunión existe
    const { data: meeting } = await supabase
      .from('meetings')
      .select('*, meeting_participants!inner(user_id, role)')
      .eq('id', id)
      .single();

    if (!meeting) {
      return NextResponse.json(
        { error: 'Reunión no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el creador o un organizador
    const isCreator = meeting.created_by === user.id;
    const isOrganizer = meeting.meeting_participants?.some(
      (p: any) => p.user_id === user.id && p.role === 'organizer'
    );

    if (!isCreator && !isOrganizer) {
      return NextResponse.json(
        { error: 'No tienes permisos para agregar participantes' },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const { user_ids, role = 'participant' } = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de user_ids' },
        { status: 400 }
      );
    }

    // Verificar que los usuarios existen
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', user_ids);

    if (usersError || !users || users.length !== user_ids.length) {
      return NextResponse.json(
        { error: 'Uno o más usuarios no existen' },
        { status: 400 }
      );
    }

    // Preparar participantes a insertar
    const participants = user_ids.map(userId => ({
      meeting_id: id,
      user_id: userId,
      role,
      attendance_status: 'invited'
    }));

    // Insertar participantes (con manejo de duplicados)
    const { data: insertedParticipants, error: insertError } = await supabase
      .from('meeting_participants')
      .upsert(participants, {
        onConflict: 'meeting_id,user_id',
        ignoreDuplicates: false
      })
      .select(`
        id,
        role,
        attendance_status,
        user:profiles(id, email, full_name)
      `);

    if (insertError) {
      console.error('Error al agregar participantes:', insertError);
      return NextResponse.json(
        { error: 'Error al agregar participantes' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        participants: insertedParticipants,
        message: `${insertedParticipants?.length || 0} participante(s) agregado(s)`
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

// GET /api/meetings/[id]/participants - Obtener participantes de una reunión
export async function GET(
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

    // Obtener participantes
    const { data: participants, error } = await supabase
      .from('meeting_participants')
      .select(`
        id,
        role,
        attendance_status,
        notes,
        user:profiles(id, email, full_name)
      `)
      .eq('meeting_id', id)
      .order('role', { ascending: false }); // Organizadores primero

    if (error) {
      console.error('Error al obtener participantes:', error);
      return NextResponse.json(
        { error: 'Error al obtener participantes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ participants }, { status: 200 });

  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}