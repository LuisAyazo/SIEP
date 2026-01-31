import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const redirectTo = requestUrl.searchParams.get('redirectTo')
  const origin = requestUrl.origin

  console.log('========================================')
  console.log('[Auth Callback] INICIO DEL CALLBACK')
  console.log('[Auth Callback] URL completa:', request.url)
  console.log('[Auth Callback] Parámetros recibidos:', {
    code: code ? `${code.substring(0, 20)}...` : null,
    error,
    errorDescription,
    allParams: Object.fromEntries(requestUrl.searchParams.entries())
  })
  console.log('========================================')

  // Si hay un error de OAuth, loguearlo
  if (error) {
    console.error('[Auth Callback] ❌ Error de OAuth recibido:', {
      error,
      description: errorDescription
    })
    return NextResponse.redirect(`${origin}/login?error=${error}&description=${encodeURIComponent(errorDescription || '')}`)
  }

  if (code) {
    console.log('[Auth Callback] ✅ Código recibido, iniciando exchange...')
    
    const supabase = await createClient()
    
    // Intercambiar el código por una sesión
    console.log('[Auth Callback] Llamando a exchangeCodeForSession...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('[Auth Callback] Resultado del exchange:', {
      hasData: !!data,
      hasSession: !!data?.session,
      hasUser: !!data?.session?.user,
      userId: data?.session?.user?.id,
      userEmail: data?.session?.user?.email,
      error: exchangeError ? {
        message: exchangeError.message,
        status: exchangeError.status,
        name: exchangeError.name
      } : null
    })
    
    if (exchangeError) {
      console.error('[Auth Callback] ❌ Error al intercambiar código:', {
        message: exchangeError.message,
        status: exchangeError.status,
        name: exchangeError.name,
        stack: exchangeError.stack
      })
      return NextResponse.redirect(`${origin}/login?error=auth_failed&message=${encodeURIComponent(exchangeError.message)}`)
    }

    if (data?.session?.user) {
      const userEmail = data.session.user.email || ''
      const userId = data.session.user.id
      const userMetadata = data.session.user.user_metadata
      
      console.log('[Auth Callback] ✅ Usuario autenticado exitosamente')
      console.log('[Auth Callback] Datos del usuario:', {
        id: userId,
        email: userEmail,
        metadata: userMetadata,
        provider: data.session.user.app_metadata?.provider
      })
      
      // Validar que el correo sea del dominio permitido
      if (!userEmail.endsWith('@unicartagena.edu.co')) {
        console.error('[Auth Callback] ❌ Dominio no permitido:', userEmail)
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=invalid_domain&email=${encodeURIComponent(userEmail)}`)
      }

      console.log('[Auth Callback] ✅ Dominio válido, verificando usuario en BD...')

      // Verificar si el usuario ya existe en la tabla profiles
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', userId)
        .single()

      console.log('[Auth Callback] Resultado de búsqueda de perfil:', {
        exists: !!existingProfile,
        profile: existingProfile,
        error: profileError ? {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details
        } : null
      })

      // Si el perfil no existe, crearlo
      if (!existingProfile && profileError?.code === 'PGRST116') {
        const userName = userMetadata?.full_name ||
                        userMetadata?.name ||
                        userEmail.split('@')[0]

        console.log('[Auth Callback] 🆕 Creando nuevo perfil en BD:', {
          id: userId,
          email: userEmail,
          full_name: userName
        })

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userEmail,
            full_name: userName,
          })
          .select()
          .single()

        if (insertError) {
          console.error('[Auth Callback] ❌ Error al crear perfil:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          })
        } else {
          console.log('[Auth Callback] ✅ Perfil creado exitosamente:', newProfile)
          
          // Asignar rol por defecto "funcionario"
          console.log('[Auth Callback] 🔑 Asignando rol por defecto...')
          const { data: defaultRole } = await supabase
            .from('roles')
            .select('id')
            .eq('name', 'funcionario')
            .single()

          if (defaultRole) {
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({
                user_id: userId,
                role_id: defaultRole.id
              })

            if (roleError) {
              console.error('[Auth Callback] ❌ Error al asignar rol:', roleError)
            } else {
              console.log('[Auth Callback] ✅ Rol "funcionario" asignado exitosamente')
            }
          }

          // Asignar centro por defecto
          console.log('[Auth Callback] 🏢 Asignando centro por defecto...')
          const { data: defaultCenter } = await supabase
            .from('centers')
            .select('id')
            .order('name')
            .limit(1)
            .single()

          if (defaultCenter) {
            const { error: centerError } = await supabase
              .from('user_centers')
              .insert({
                user_id: userId,
                center_id: defaultCenter.id
              })

            if (centerError) {
              console.error('[Auth Callback] ❌ Error al asignar centro:', centerError)
            } else {
              console.log('[Auth Callback] ✅ Centro asignado exitosamente')
            }
          }
        }
      } else if (existingProfile) {
        console.log('[Auth Callback] ✅ Perfil ya existe en BD:', existingProfile)
      }

      // Determinar la URL de redirección
      let redirectUrl: string;
      
      if (redirectTo) {
        // Si hay un redirectTo, usarlo
        redirectUrl = `${origin}${redirectTo}`;
        console.log('[Auth Callback] 🚀 Redirigiendo a URL solicitada:', redirectUrl)
      } else {
        // Obtener el centro por defecto desde la base de datos
        const { data: centers } = await supabase
          .from('centers')
          .select('slug')
          .order('name')
          .limit(1)
        
        const centerSlug = centers?.[0]?.slug || 'centro-educacion-continua'
        redirectUrl = `${origin}/center/${centerSlug}/dashboard`;
        console.log('[Auth Callback] 🚀 Redirigiendo a dashboard por defecto:', redirectUrl)
      }
      
      console.log('========================================')

      // Redirigir
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error('[Auth Callback] ❌ No hay sesión o usuario después del exchange')
      console.log('========================================')
      return NextResponse.redirect(`${origin}/login?error=no_session`)
    }
  }

  // Si no hay código o algo salió mal, redirigir al login
  console.error('[Auth Callback] ❌ No se recibió código de autenticación')
  console.log('[Auth Callback] Redirigiendo a login con error=no_code')
  console.log('========================================')
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}