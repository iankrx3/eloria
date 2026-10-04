import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { LOOP_SECONDS, MOCK_SOUNDSCAPES, mockSoundscapeWav } from './mock-soundscapes';

const hash = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
const sampleAt = (bytes: Uint8Array, index: number) =>
  new DataView(bytes.buffer).getInt16(44 + index * 2, true);

describe('mockSoundscapeWav', () => {
  it('종류마다 20초 WAV를 만들고 결과는 매번 같다', () => {
    for (const { key } of MOCK_SOUNDSCAPES) {
      const a = mockSoundscapeWav(key);
      expect(a.loopDurationSec).toBe(LOOP_SECONDS);
      expect(new TextDecoder().decode(a.bytes.slice(0, 4))).toBe('RIFF');
      expect(a.bytes.length).toBe(44 + LOOP_SECONDS * 22_050 * 2);
      expect(hash(mockSoundscapeWav(key).bytes)).toBe(hash(a.bytes));
    }
  });

  it('반복할 때 끝과 처음이 크게 튀지 않는다', () => {
    for (const { key } of MOCK_SOUNDSCAPES) {
      const { bytes } = mockSoundscapeWav(key);
      const last = sampleAt(bytes, LOOP_SECONDS * 22_050 - 1);
      const first = sampleAt(bytes, 0);
      // 백색소음은 원래 샘플 간 차이가 크므로 전체 범위(±32767)의 절반 미만이면 통과
      expect(Math.abs(last - first)).toBeLessThan(16_000);
    }
  });
});
