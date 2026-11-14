import { describe, expect, it } from 'vitest';
import {
  ARIN_BODY_MAX,
  ARIN_BODY_MIN,
  arinStorySchema,
  recentLineFromStory,
  sampleArinStory,
  splitSentences,
} from './arin-story';

describe('arinStorySchema', () => {
  it('예시 이야기는 통과하고 본문은 공백 제외 1400~1600자다', () => {
    const story = sampleArinStory();
    expect(arinStorySchema.safeParse(story).success).toBe(true);
    const compact = story.paragraphs.flat().join('').replace(/\s/g, '').length;
    expect(compact).toBeGreaterThanOrEqual(ARIN_BODY_MIN);
    expect(compact).toBeLessThanOrEqual(ARIN_BODY_MAX);
  });

  it('문장이 60자를 넘거나 마지막이 확언이 아니면 거절한다', () => {
    const story = sampleArinStory();
    story.paragraphs[0] = ['가'.repeat(61)];
    expect(arinStorySchema.safeParse(story).success).toBe(false);

    const unquoted = sampleArinStory();
    unquoted.paragraphs[unquoted.paragraphs.length - 1] = ['나는 이미 이 하루 안에 있다.'];
    expect(arinStorySchema.safeParse(unquoted).success).toBe(false);

    const theme = { ...sampleArinStory(), theme: '여유' };
    expect(arinStorySchema.safeParse(theme).success).toBe(false);
  });

  it('문단은 1~3문장', () => {
    expect(splitSentences('나는 창을 연다. 빛이 들어온다. 커피가 식기 전에.')).toHaveLength(3);
    const story = sampleArinStory();
    story.paragraphs[1] = ['하나.', '둘.', '셋.', '넷.'];
    expect(arinStorySchema.safeParse(story).success).toBe(false);
  });
});

describe('recentLineFromStory', () => {
  it('제목, 따옴표 대사, 마지막 확언을 한 줄로 잇는다', () => {
    expect(
      recentLineFromStory({
        title: '청담의 아침',
        script: '창을 연다.\n\n"오늘은 내 거야." 라고 말한다.',
        affirmations: ['처음', '마지막 확언'],
      }),
    ).toBe('청담의 아침 오늘은 내 거야. 마지막 확언');
  });
});
