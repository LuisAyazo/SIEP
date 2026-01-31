import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/meetings/[id]/participants/[userId] - Actualizar estado de asistencia
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const { attendance_status, notes } = body;

    if (!attendance_status) {
      return NextResponse.json(
        { error: 'Se requiere attendance_status' },
        { status: 400 }
      );
    }

    // Validar valores permitidos
    const validStatuses = ['invited', 'accepted', 'declined', 'maybe', 'attended', 'not_attended'];
    if (!validStatuses.includes(attendance_status)) {
      return NextResponse.json(
        { error: `Estado inválido. Valores permitidos: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Verificar que el participante existe
    const { data: participant } = await supabase
      .from('meeting_participants')
      .select('*, meeting:meetings(created_by)')
      .eq('meeting_id', id)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      return NextResponse.json(
        { error: 'Participante no encontrado en esta reunión' },
        { status: 404 }
      );
    }

    // Verificar permisos:
    // - El mismo usuario puede actualizar su propia asistencia
    // - El creador de la reunión puede marcar asistencia de todos
    const isSelf = userId === user.id;
    const isCreator = participant.meeting?.created_by === user.id;

    if (!isSelf && !isCreator) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar este participante' },
        { status: 403 }
      );
    }

    // Construir objeto de actualización (sin notes, esa columna no existe)
    const updateData: any = { attendance_status };

    // Actualizar participante
    const { data: updatedParticipant, error: updateError } = await supabase
      .from('meeting_participants')
      .update(updateData)
      .eq('meeting_id', id)
      .eq('user_id', userId)
      .select(`
        id,
        role,
        attendance_status,
        user:profiles(id, email, full_name)
      `)
      .single();

    if (updateError) {
      console.error('Error al actualizar participante:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar participante' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        participant: updatedParticipant,
        message: 'Estado de asistencia actualizado'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/meetings/[id]/participants/[userId] - Remover participante
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;
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
      .select('created_by')
      .eq('id', id)
      .single();

    if (!meeting) {
      return NextResponse.json(
        { error: 'Reunión no encontrada' },
        { status: 404 }
      );
    }

    // Solo el creador puede remover participantes
    if (meeting.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Solo el creador puede remover participantes' },
        { status: 403 }
      );
    }

    // No permitir remover al creador
    if (userId === meeting.created_by) {
      return NextResponse.json(
        { error: 'No puedes remover al creador de la reunión' },
        { status: 400 }
      );
    }

    // Eliminar participante
    const { error: deleteError } = await supabase
      .from('meeting_participants')
      .delete()
      .eq('meeting_id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error al remover participante:', deleteError);
      return NextResponse.json(
        { error: 'Error al remover participante' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Participante removido exitosamente' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}