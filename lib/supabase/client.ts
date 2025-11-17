/**
 * Cliente de Supabase para componentes del lado del cliente (Client Components)
 * Usa cookies para manejar la sesión del usuario
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}