import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { email, roleName } = await request.json()

    // Buscar el usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Buscar el rol
    const { data: role } = await supabase
      .from('roles')
      .select('id, name')
      .eq('name', roleName)
      .single()

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })
    }

    // Verificar si ya tiene un rol asignado
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', profile.id)
      .single()

    if (existingRole) {
      // Actualizar el rol existente
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role_id: role.id })
        .eq('user_id', profile.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    } else {
      // Insertar nuevo rol
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.id,
          role_id: role.id
        })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Rol actualizado a ${roleName} para ${email}`,
      user: profile,
      role
    })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
