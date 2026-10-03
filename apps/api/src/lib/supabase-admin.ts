import type { Database } from '@eloria/shared';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type AdminClient = SupabaseClient<Database>;

/**
 * service role 클라이언트. RLS를 우회하므로 모든 쿼리는 토큰에서 얻은 userId로 범위를 좁힌다.
 * 이 클라이언트는 apps/api 안에서만 만든다(CLAUDE.md 보안 규칙).
 */
export function createAdminClient(url: string, serviceRoleKey: string): AdminClient {
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
