// app/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

// Crea un client Supabase per il BROWSER (frontend).
// Utilizza solo le chiavi pubbliche e sicure.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
