import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// Retrieve configuration from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('placeholder')
)

/**
 * Explicit development-only mock toggle.
 * Under no circumstances can mock auth be active in production.
 */
export const isMockAuthEnabled = Boolean(
  import.meta.env.DEV &&
  (import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true' || import.meta.env.VITE_ENABLE_MOCK_AUTH === '1')
)

// Strict production configuration validation
if (import.meta.env.PROD && !isSupabaseConfigured) {
  throw new Error(
    '[LNCT Connect Production Error] Missing valid Supabase credentials. ' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be provided in production.'
  )
}

// Development configuration notice
if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.info(
    '%c[LNCT Connect] Supabase Client Setup%c\n' +
    'Environment variables VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are not configured.\n' +
    'The application is running in local fallback mode.\n' +
    'To connect to your live database: copy .env.example to .env.local and fill in your Supabase credentials.\n' +
    (isMockAuthEnabled
      ? '✓ Development mock auth is explicitly enabled via VITE_ENABLE_MOCK_AUTH=true.'
      : 'ℹ Mock auth is disabled. Live operations will return explicit unconfigured errors unless VITE_ENABLE_MOCK_AUTH=true is set.'),
    'background: #E76F35; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
    'color: inherit;'
  )
}

// Safe fallback credentials to allow build & offline dev rendering without crashing
const resolvedUrl = supabaseUrl || 'https://placeholder.supabase.co'
const resolvedKey = supabaseKey || 'placeholder-anon-key'

/**
 * Global typed Supabase client singleton for LNCT Connect.
 * Enforces PostgreSQL Row Level Security (RLS) on all client operations.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  resolvedUrl,
  resolvedKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)
