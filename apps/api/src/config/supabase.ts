import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Server-side admin client. Uses the service-role key — NEVER expose this to
 * the browser. Used to validate bearer tokens and manage storage/users.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
