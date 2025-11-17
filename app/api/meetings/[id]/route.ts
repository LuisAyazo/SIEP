import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/meetings/[id] - Obtener detalles de una reunión
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

    // Obtener reunión con todas las relaciones
    const { data: meeting, error } = await supabase
      .from('meetings')
      .select(`
        *,
        center:centers(id, name, slug),
        created_by_user:profiles!created_by(id, email, full_name),
        meeting_participants(
          id,
          role,
          attendance_status,
          notes,
          user:profiles(id, email, full_name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al obtener reunión:', error);
      return NextResponse.json(
        { error: 'Reunión no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ meeting }, { status: 200 });

  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH /api/meetings/[id] - Actualizar reunión
export async function PATCH(
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

    // Verificar que la reunión existe y el usuario tiene permisos
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
        { error: 'No tienes permisos para actualizar esta reunión' },
        { status: 403 }
      );
    }

    // Obtener datos a actualizar
    const body = await request.json();
    const {
      title,
      description,
      scheduled_at,
      duration_minutes,
      meeting_platform,
      meeting_url,
      status
    } = body;

    // Construir objeto de actualización solo con campos proporcionados
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at;
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
    if (meeting_platform !== undefined) updateData.meeting_platform = meeting_platform;
    if (meeting_url !== undefined) updateData.meeting_url = meeting_url;
    if (status !== undefined) updateData.status = status;

    // Actualizar reunión
    const { data: updatedMeeting, error: updateError } = await supabase
      .from('meetings')
      .update(updateData)
      .eq('id', id)
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
      .single();

    if (updateError) {
      console.error('Error al actualizar reunión:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar reunión' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { meeting: updatedMeeting, message: 'Reunión actualizada exitosamente' },
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

// DELETE /api/meetings/[id] - Cancelar reunión
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

    // Verificar que la reunión existe y el usuario tiene permisos
    const { data: meeting } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single();

    if (!meeting) {
      return NextResponse.json(
        { error: 'Reunión no encontrada' },
        { status: 404 }
      );
    }

    // Solo el creador puede cancelar la reunión
    if (meeting.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Solo el creador puede cancelar la reunión' },
        { status: 403 }
      );
    }

    // Marcar como cancelada en lugar de eliminar
    const { error: updateError } = await supabase
      .from('meetings')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (updateError) {
      console.error('Error al cancelar reunión:', updateError);
      return NextResponse.json(
        { error: 'Error al cancelar reunión' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Reunión cancelada exitosamente' },
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