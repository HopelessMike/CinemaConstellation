// app/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Crea un client Supabase per ambienti SERVER-SIDE (API Routes, Server Actions).
// Usa la Service Role Key per ottenere privilegi amministrativi e bypassare la RLS.
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Usa la chiave segreta per operazioni admin
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Ignora errori se chiamato da un Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options })
          } catch (error) {
            // Ignora errori se chiamato da un Server Component
          }
        },
      },
    }
  )
}