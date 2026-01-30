import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Crear cliente de Supabase con service role key para operaciones de admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar que el usuario actual es administrador usando el cliente normal
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const supabase = await createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar permisos de administrador
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some((ur: any) =>
      ur.roles?.name === 'administrador'
    );

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear usuarios' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, full_name, role_id, center_ids } = body;

    // Validar datos requeridos
    if (!email || !password || !full_name || !role_id) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Crear usuario usando admin API con service role key
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar el email
      user_metadata: {
        full_name
      }
    });

    if (createError) {
      console.error('Error creando usuario:', createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: 'No se pudo crear el usuario' },
        { status: 500 }
      );
    }

    const newUserId = newUser.user.id;

    // Crear perfil del usuario en la tabla profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUserId,
        email: email,
        full_name: full_name
      });

    if (profileError) {
      console.error('Error creando perfil:', profileError);
      // Eliminar el usuario de auth si falla la creación del perfil
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { error: `Error creando perfil del usuario: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Asignar rol al usuario usando el cliente admin
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUserId,
        role_id: role_id
      });

    if (roleError) {
      console.error('Error asignando rol:', roleError);
      // Rollback: eliminar perfil y usuario
      await supabaseAdmin.from('profiles').delete().eq('id', newUserId);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { error: `Error asignando rol al usuario: ${roleError.message}` },
        { status: 500 }
      );
    }

    // Asignar centros al usuario usando el cliente admin
    if (center_ids && center_ids.length > 0) {
      const centerAssignments = center_ids.map((centerId: string) => ({
        user_id: newUserId,
        center_id: centerId
      }));

      const { error: centersError } = await supabaseAdmin
        .from('user_centers')
        .insert(centerAssignments);

      if (centersError) {
        console.error('Error asignando centros:', centersError);
        // Rollback completo: eliminar rol, perfil y usuario
        await supabaseAdmin.from('user_roles').delete().eq('user_id', newUserId);
        await supabaseAdmin.from('profiles').delete().eq('id', newUserId);
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        return NextResponse.json(
          { error: `Error asignando centros al usuario: ${centersError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: true,
        user_id: newUserId,
        message: 'Usuario creado exitosamente'
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error en POST /api/admin/users:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
