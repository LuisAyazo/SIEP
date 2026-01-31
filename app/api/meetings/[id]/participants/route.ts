import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/meetings/[id]/participants - Agregar participante
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

    const body = await request.json();
    const { user_id, external_email, role = 'participant' } = body;

    // Validar que se proporcione user_id O external_email
    if (!user_id && !external_email) {
      return NextResponse.json(
        { error: 'Debe proporcionar user_id o external_email' },
        { status: 400 }
      );
    }

    // Verificar que la reunión existe y el usuario es el creador
    const { data: meeting } = await supabase
      .from('meetings')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!meeting) {
      return NextResponse.json(
        { error: 'Reunión no encontrada' },
        { status: 404 }
      );
    }

    if (meeting.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Solo el creador puede agregar participantes' },
        { status: 403 }
      );
    }

    // Agregar participante
    const { data: participant, error: insertError } = await supabase
      .from('meeting_participants')
      .insert({
        meeting_id: id,
        user_id: user_id || null,
        external_email: external_email || null,
        role,
        attendance_status: 'invited'
      })
      .select(`
        id,
        role,
        attendance_status,
        external_email,
        notes,
        user:profiles(id, email, full_name)
      `)
      .single();

    if (insertError) {
      console.error('Error al agregar participante:', insertError);
      return NextResponse.json(
        { error: 'Error al agregar participante' },
        { status: 500 }
      );
    }

    return NextResponse.json({ participant }, { status: 201 });

  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/meetings/[id]/participants?participant_id=xxx - Eliminar participante
export async function DELETE(
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

    const participantId = request.nextUrl.searchParams.get('participant_id');

    if (!participantId) {
      return NextResponse.json(
        { error: 'participant_id es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la reunión existe y el usuario es el creador
    const { data: meeting } = await supabase
      .from('meetings')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!meeting) {
      return NextResponse.json(
        { error: 'Reunión no encontrada' },
        { status: 404 }
      );
    }

    if (meeting.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Solo el creador puede eliminar participantes' },
        { status: 403 }
      );
    }

    // No permitir eliminar al organizador
    const { data: participant } = await supabase
      .from('meeting_participants')
      .select('role')
      .eq('id', participantId)
      .single();

    if (participant?.role === 'organizer') {
      return NextResponse.json(
        { error: 'No se puede eliminar al organizador' },
        { status: 400 }
      );
    }

    // Eliminar participante
    const { error: deleteError } = await supabase
      .from('meeting_participants')
      .delete()
      .eq('id', participantId)
      .eq('meeting_id', id);

    if (deleteError) {
      console.error('Error al eliminar participante:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar participante' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
