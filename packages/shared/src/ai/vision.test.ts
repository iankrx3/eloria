import { describe, expect, it } from 'vitest';
import { visionSchema } from './vision';

describe('visionSchema', () => {
  it('예전 summary를 hint로 읽고 장소·시간대는 버린다', () => {
    const parsed = visionSchema.parse({
      title: '노을 진 작업실',
      summary: '창밖 바다를 보며 하루를 정리한다',
      place: '바닷가 작업실',
      timeOfDay: 'evening',
      position: 2,
      storyId: null,
    });
    expect(parsed).toEqual({
      title: '노을 진 작업실',
      hint: '창밖 바다를 보며 하루를 정리한다',
      position: 2,
      storyId: null,
    });
  });

  it('hint가 있으면 summary보다 먼저 쓴다', () => {
    const parsed = visionSchema.parse({
      title: '창을 연다',
      hint: '따뜻한 결',
      summary: '예전 문장',
      position: 1,
      storyId: null,
    });
    expect(parsed.hint).toBe('따뜻한 결');
  });
});