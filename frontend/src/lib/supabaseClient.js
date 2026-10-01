/**
 * supabaseClient.js
 * -----------------
 * Single Supabase client instance for CERTI-VAULT.
 *
 * Credentials are loaded exclusively from environment variables so that
 * no secrets are hard-coded or committed to version control.
 *
 * Required variables (set in .env.local — never commit that file):
 *   VITE_SUPABASE_URL            — your Supabase project URL
 *   VITE_SUPABASE_PUBLISHABLE_KEY — your Supabase anon / publishable key
 *
 * SECURITY NOTE:
 *   Only the anon (publishable) key is used here. The service_role key
 *   must never be placed in frontend code. All data access must be
 *   protected by Row Level Security (RLS) policies on the Supabase side.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// --- Safe configuration check ------------------------------------------------
// Fail loudly at startup rather than silently during the first database call.
if (!supabaseUrl || supabaseUrl === 'your-supabase-project-url-here') {
  throw new Error(
    '[CERTI-VAULT] Missing environment variable: VITE_SUPABASE_URL\n' +
      'Open frontend/.env.local and set your Supabase project URL.\n' +
      'Find it at: https://supabase.com/dashboard -> Project Settings -> API'
  )
}

if (
  !supabasePublishableKey ||
  supabasePublishableKey === 'your-supabase-anon-key-here'
) {
  throw new Error(
    '[CERTI-VAULT] Missing environment variable: VITE_SUPABASE_PUBLISHABLE_KEY\n' +
      'Open frontend/.env.local and set your Supabase anon (publishable) key.\n' +
      'Find it at: https://supabase.com/dashboard -> Project Settings -> API\n' +
      'WARNING: Do NOT use the service_role key here -- use the anon key only.'
  )
}
// -----------------------------------------------------------------------------

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
