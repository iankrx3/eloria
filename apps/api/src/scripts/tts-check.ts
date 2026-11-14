/**
 * ElevenLabs 연결 확인(D-49).
 *
 *   pnpm --filter @eloria/api tts:check
 *       크레딧 사용량과 이 계정이 쓸 수 있는 보이스 목록(크레딧 들지 않음)
 *   pnpm --filter @eloria/api tts:check --say "서아 님, 천천히 숨을 들이마셔 보세요." [--voice <id>] [--model <id>]
 *       짧은 샘플 1개를 만든다(글자 수만큼 크레딧 사용, 기본 상한 200). 결과는 임시 폴더의 MP3
 *
 * 키는 ELEVENLABS_API_KEY(apps/api/.env 또는 셸 환경)에서 읽는다. 이 스크립트의 샘플은
 * generation_jobs에 기록되지 않으므로 서버의 월 집계에 안 잡힌다. 그래서 상한을 작게 둔다.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import {
  createElevenLabsAccount,
  createElevenLabsTts,
  createMemoryTtsBudget,
  ELEVENLABS_DEFAULT_MODEL,
  ttsCredits,
} from '@eloria/providers';

const { values: args } = parseArgs({
  options: {
    say: { type: 'string' },
    voice: { type: 'string' },
    model: { type: 'string' },
    'max-credits': { type: 'string', default: '200' },
  },
});

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error('ELEVENLABS_API_KEY가 없습니다(apps/api/.env 또는 셸 환경).');
  process.exit(1);
}

const account = createElevenLabsAccount({ apiKey });

try {
  const sub = await account.subscription();
  const reset = sub.next_character_count_reset_unix
    ? new Date(sub.next_character_count_reset_unix * 1000).toISOString().slice(0, 10)
    : '-';
  console.log(
    `플랜 ${sub.tier}: ${sub.character_count.toLocaleString()} / ${sub.character_limit.toLocaleString()} 크레딧 사용, 초기화 ${reset}`,
  );
} catch (error) {
  // 키 권한에서 User 읽기를 막아 두면 여기서 실패한다. 음성 생성에는 필요 없다.
  console.warn(`사용량 조회 실패(키 권한 확인): ${(error as Error).message}`);
}

if (!args.say) {
  const voices = await account.voices();
  console.log(`\n쓸 수 있는 보이스 ${voices.length}개`);
  for (const v of voices) {
    const labels = Object.entries(v.labels ?? {})
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');
    console.log(`  ${v.voice_id}  ${v.name} [${v.category ?? '-'}] ${labels}`);
  }
  console.log('\n고른 ID를 ELEVENLABS_DEFAULT_VOICE_ID에 넣고, --say로 들어 보세요.');
  process.exit(0);
}

const model = args.model ?? process.env.ELEVENLABS_STORY_MODEL ?? ELEVENLABS_DEFAULT_MODEL;
const voiceId = args.voice ?? process.env.ELEVENLABS_DEFAULT_VOICE_ID;
if (!voiceId) {
  console.error('--voice <id> 또는 ELEVENLABS_DEFAULT_VOICE_ID가 필요합니다.');
  process.exit(1);
}
const maxCredits = Number(args['max-credits']);
const credits = ttsCredits(model, args.say.length);
console.log(`${model} · ${voiceId} · ${args.say.length}자 → ${credits}크레딧 (상한 ${maxCredits})`);

const tts = createElevenLabsTts({
  apiKey,
  model,
  defaultVoiceId: voiceId,
  budget: createMemoryTtsBudget({ perCall: maxCredits, total: maxCredits }),
});
const result = await tts.synthesize({ text: args.say, voiceId });
const dir = join(tmpdir(), 'eloria-tts');
mkdirSync(dir, { recursive: true });
const file = join(dir, `${new Date().toISOString().replace(/[:.]/g, '-')}-${model}-${voiceId}.mp3`);
writeFileSync(file, result.audio);
console.log(`저장: ${file} (${result.durationSec.toFixed(1)}초, 약 $${result.usage.estCostUsd})`);
