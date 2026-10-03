import type { PushTokenRequest } from '@eloria/shared';
import type { AdminClient } from '../lib/supabase-admin';

export interface PushRepo {
  /** 토큰은 기기마다 하나라서, 같은 토큰이 다른 계정에 있었다면 지금 사용자로 옮긴다. */
  upsertToken(userId: string, token: PushTokenRequest): Promise<void>;
  listTokens(userId: string): Promise<string[]>;
  deleteTokens(tokens: readonly string[]): Promise<void>;
}

export function createSupabasePushRepo(db: AdminClient): PushRepo {
  return {
    async upsertToken(userId, { token, platform }) {
      const { error } = await db
        .from('push_tokens')
        .upsert({ user_id: userId, token, platform }, { onConflict: 'token' });
      if (error) throw error;
    },

    async listTokens(userId) {
      const { data, error } = await db.from('push_tokens').select('token').eq('user_id', userId);
      if (error) throw error;
      return data.map((r) => r.token);
    },

    async deleteTokens(tokens) {
      if (tokens.length === 0) return;
      const { error } = await db
        .from('push_tokens')
        .delete()
        .in('token', [...tokens]);
      if (error) throw error;
    },
  };
}
