import { safetyVerdictSchema, scenePlanSchema } from '@eloria/shared';
import { describe, expect, it } from 'vitest';
import { createMockProviders } from './mock-providers';
import { chimeWav } from './chime-wav';
import { silentMp3 } from './silent-mp3';

const ctx = {
  dream: '바다가 보이는 작업실',
  displayName: '서아',
  tone: 'calm' as const,
  people: [{ name: '민준', relation: 'partner' }],
  dayStart: 'seaside',
};

describe('mock providers', () => {
  const p = createMockProviders();

  it('장면 계획은 AI_PIPELINE 4.1 스키마를 만족하고 프로필의 사람만 쓴다', async () => {
    const { plan, usage } = await p.story.planScenes(ctx);
    expect(scenePlanSchema.parse(plan).people).toEqual([{ name: '민준', role: 'partner' }]);
    expect(usage).toMatchObject({ provider: 'mock', estCostUsd: 0 });
  });

  it('스크립트는 이름을 부르고 결과를 약속하는 표현이 없다', async () => {
    const { plan } = await p.story.planScenes(ctx);
    const { script } = await p.story.writeStory(plan, ctx, { targetChars: 3200, maxChars: 3800 });
    expect(script).toContain('서아');
    expect(script).not.toMatch(/반드시|이루어집니다|보장/);
  });

  it('위기 신호가 있으면 self_harm으로 차단한다', async () => {
    const blocked = await p.story.reviewSafety('요즘 죽고 싶어요');
    expect(safetyVerdictSchema.parse(blocked.verdict)).toEqual({
      verdict: 'block',
      reasons: ['self_harm'],
    });
    expect((await p.story.reviewSafety('바다가 보이는 집')).verdict.verdict).toBe('pass');
  });

  it('TTS는 들리는 차임 WAV를 돌려준다', async () => {
    const { audio, mime, durationSec, usage } = await p.tts.synthesize({
      text: '가'.repeat(70),
      voiceId: 'v',
    });
    expect(mime).toBe('audio/wav');
    expect(String.fromCharCode(...audio.slice(0, 4))).toBe('RIFF');
    expect(audio.slice(44).some((b) => b !== 0)).toBe(true); // 무음이 아님
    expect(durationSec).toBeGreaterThanOrEqual(10);
    expect(usage.ttsChars).toBe(70);
  });
});

describe('silentMp3', () => {
  it('요청한 길이 이상을 프레임 단위로 만든다', () => {
    const { bytes, durationSec } = silentMp3(1);
    expect(durationSec).toBeGreaterThanOrEqual(1);
    expect(bytes.length % 417).toBe(0);
  });
});

describe('chimeWav', () => {
  it('16kHz 모노 16비트 PCM 헤더와 요청한 길이', () => {
    const { bytes, durationSec } = chimeWav(2);
    const view = new DataView(bytes.buffer);
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint16(34, true)).toBe(16);
    expect(durationSec).toBe(2);
    expect(bytes.length).toBe(44 + 2 * 16000 * 2);
  });
});
