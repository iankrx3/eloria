import type { AdminClient } from '../lib/supabase-admin';

export interface AccountRepo {
  /** 사용자 파일·행·계정을 지우고 사유만 익명으로 남긴다. */
  deleteAccount(userId: string, reasons: string[]): Promise<void>;
}

/** 사용자 파일이 있는 private 버킷(경로 첫 부분이 user_id) */
const USER_BUCKETS = ['story-audio', 'story-covers', 'vision-photos'] as const;

async function listAll(db: AdminClient, bucket: string, prefix: string): Promise<string[]> {
  const { data, error } = await db.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw error;
  const paths: string[] = [];
  for (const item of data) {
    const path = `${prefix}/${item.name}`;
    // id가 없으면 폴더다.
    if (item.id === null) paths.push(...(await listAll(db, bucket, path)));
    else paths.push(path);
  }
  return paths;
}

export function createSupabaseAccountRepo(db: AdminClient): AccountRepo {
  return {
    // 순서: 사유 → 파일 → 계정. 계정을 지우면 사용자 표는 on delete cascade로 함께 지워진다.
    // 중간에 실패해도 다시 호출하면 같은 결과가 되도록 한다(이미 지운 파일은 목록에 없다).
    async deleteAccount(userId, reasons) {
      const { error: reasonError } = await db.from('account_deletions').insert({ reasons });
      if (reasonError) throw reasonError;

      for (const bucket of USER_BUCKETS) {
        const paths = await listAll(db, bucket, userId);
        for (let i = 0; i < paths.length; i += 100) {
          const { error } = await db.storage.from(bucket).remove(paths.slice(i, i + 100));
          if (error) throw error;
        }
      }

      const { error } = await db.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
  };
}
