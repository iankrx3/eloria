/**
 * 배경 사운드 시드(docs/AI_PIPELINE.md 7절). 지금은 합성 루프(mock)를 public `soundscapes` 버킷에 올리고
 * soundscapes 행을 key 기준으로 upsert한다. 다시 돌려도 같은 결과다.
 * 실행: pnpm --filter @eloria/api seed:soundscapes [--dry-run]
 */
import { loadEnv } from '../env';
import { createAdminClient } from '../lib/supabase-admin';
import { MOCK_SOUNDSCAPES, mockSoundscapeWav } from '../soundscapes/mock-soundscapes';

const dryRun = process.argv.includes('--dry-run');
const env = loadEnv();
const db = createAdminClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

for (const { key, displayName } of MOCK_SOUNDSCAPES) {
  const { bytes, loopDurationSec } = mockSoundscapeWav(key);
  const path = `${key}.wav`;
  console.log(
    `${dryRun ? '[dry-run] ' : ''}${key} → soundscapes/${path} (${(bytes.length / 1024 / 1024).toFixed(2)}MB)`,
  );
  if (dryRun) continue;

  const { error: uploadError } = await db.storage
    .from('soundscapes')
    .upload(path, bytes, { contentType: 'audio/wav', upsert: true });
  if (uploadError) throw uploadError;

  const { error } = await db.from('soundscapes').upsert(
    {
      key,
      display_name: displayName,
      storage_path: path,
      loop_duration_sec: loopDurationSec,
      is_active: true,
    },
    { onConflict: 'key' },
  );
  if (error) throw error;
}
console.log(dryRun ? 'dry-run 끝(아무것도 올리지 않음)' : '배경 사운드 시드 완료');
