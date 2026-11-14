/**
 * 라이브러리 시드(Figma L01, D-47). 다시 돌려도 이미 있는 항목(seed_key)은 건너뛴다.
 *
 *   pnpm --filter @eloria/api seed:library --dry-run   무엇을 만들지 보기만
 *   pnpm --filter @eloria/api seed:library             새 카탈로그 항목(mock 글·차임 음성) + 주파수 음원
 *   pnpm --filter @eloria/api seed:library --live --max-calls 60   글을 실제 Gemini로(쿼터 사용)
 *
 * 카탈로그 항목은 사용자 스토리와 같은 파이프라인을 이 프로세스 안에서 바로 돌린다(Inngest 없이).
 * 주파수(528·432·777Hz)는 AI 없이 ffmpeg로 10분 반복 음원을 합성해 올린다.
 */
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { createMemoryBudget, createMockProviders, createProviders } from '@eloria/providers';
import { loadEnv } from '../env';
import { createAdminClient } from '../lib/supabase-admin';
import { LIBRARY_CATALOG } from '../library/catalog';
import { planLibrarySeed } from '../library/seed';
import { runStoryPipeline } from '../pipeline/story-pipeline';
import { createSupabaseLibraryRepo } from '../repos/library-repo';
import { createSupabasePipelineRepo } from '../repos/pipeline-repo';

const { values: args } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    live: { type: 'boolean', default: false },
    'max-calls': { type: 'string', default: '60' },
  },
});
const dryRun = args['dry-run'];

/** 주파수 트랙(Figma L01 주파수 카드 순서) */
const FREQUENCIES = [
  { key: 'frequency-528', hz: 528, title: '528Hz 사랑의 주파수' },
  { key: 'frequency-432', hz: 432, title: '432Hz 깊은 안정' },
  { key: 'frequency-777', hz: 777, title: '777Hz 행운의 주파수' },
] as const;
const FREQUENCY_SECONDS = 600;

const env = loadEnv();
const db = createAdminClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const libraryRepo = createSupabaseLibraryRepo(db);
const pipelineRepo = createSupabasePipelineRepo(db);

const providers = args.live
  ? createProviders(
      { ...process.env, PROVIDER_MODE: 'mock', GEMINI_MODE: 'live', TTS_MODE: 'mock' },
      { budget: createMemoryBudget(Number(args['max-calls'])) },
    )
  : createMockProviders();

const existing = await libraryRepo.listSeedKeys();
const plan = planLibrarySeed(LIBRARY_CATALOG, existing);
const frequencies = FREQUENCIES.filter((f) => !existing.includes(f.key));

console.log(`카탈로그 새 항목 ${plan.length}개 (글: ${args.live ? 'Gemini live' : 'mock'})`);
for (const item of plan) {
  console.log(
    `  ${item.key} [${item.category}${item.wishTheme ? ` · ${item.wishTheme}` : ''}] ${item.title ?? item.theme}`,
  );
}
console.log(
  `주파수 새 항목 ${frequencies.length}개: ${frequencies.map((f) => f.key).join(', ') || '-'}`,
);
if (dryRun) {
  console.log('dry-run 끝(아무것도 쓰지 않음)');
} else {
  // ── 카탈로그 항목: 행을 만들고 파이프라인을 바로 돌린다 ──────────────────────
  let failed = 0;
  for (const item of plan) {
    const storyId = await libraryRepo.createItem(item);
    try {
      const result = await runStoryPipeline(
        { repo: pipelineRepo, providers },
        { storyId },
        (_id, fn) => fn(),
      );
      console.log(`  ✓ ${item.key} → ${result.outcome}`);
    } catch (error) {
      failed += 1;
      console.error(`  ✗ ${item.key}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ── 주파수: ffmpeg로 합성 → story-audio/library/{storyId}/{assetId}.mp3 ──────────
  const work = mkdtempSync(join(tmpdir(), 'arin-frequency-'));
  try {
    for (const [i, f] of FREQUENCIES.entries()) {
      if (!frequencies.includes(f)) continue;
      const file = join(work, `${f.key}.mp3`);
      // 기음 + 한 옥타브 아래를 겹치고 아주 느린 떨림을 준다. 반복 재생 이음새가 튀지 않게 양끝 0.5초만 줄인다.
      execFileSync('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-f',
        'lavfi',
        '-i',
        `aevalsrc='0.16*sin(2*PI*${f.hz}*t)+0.07*sin(2*PI*${f.hz / 2}*t)':s=44100:d=${FREQUENCY_SECONDS}`,
        '-af',
        `tremolo=f=0.1:d=0.25,afade=t=in:d=0.5,afade=t=out:st=${FREQUENCY_SECONDS - 0.5}:d=0.5`,
        '-ac',
        '1',
        '-b:a',
        '96k',
        file,
      ]);
      const bytes = readFileSync(file);

      const { data: story, error: storyError } = await db
        .from('stories')
        .insert({ user_id: null, kind: 'library', version: 1, status: 'ready', title: f.title })
        .select('id')
        .single();
      if (storyError) throw storyError;

      const assetId = randomUUID();
      const path = `library/${story.id}/${assetId}.mp3`;
      const { error: uploadError } = await db.storage
        .from('story-audio')
        .upload(path, bytes, { contentType: 'audio/mpeg', upsert: true });
      if (uploadError) throw uploadError;

      const { error: assetError } = await db.from('story_assets').insert({
        id: assetId,
        story_id: story.id,
        type: 'audio',
        storage_path: path,
        duration_sec: FREQUENCY_SECONDS,
        mime: 'audio/mpeg',
        bytes: bytes.length,
        provider: 'synth',
        model: 'ffmpeg-sine',
      });
      if (assetError) throw assetError;

      const { error: itemError } = await db.from('library_items').insert({
        story_id: story.id,
        category: 'frequency',
        seed_key: f.key,
        theme: f.title,
        tone: 'calm',
        sort: i,
        is_free: i === 0,
      });
      if (itemError) throw itemError;
      console.log(`  ✓ ${f.key} (${(bytes.length / 1024 / 1024).toFixed(1)}MB)`);
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }

  console.log(
    failed
      ? `끝(실패 ${failed}개, 다시 돌리면 실패한 항목은 건너뛰니 행을 확인하세요)`
      : '라이브러리 시드 완료',
  );
}
