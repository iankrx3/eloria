import { z } from 'zod';

/**
 * 인수인계 9번의 이야기 JSON.
 * 저장 전에 이 스키마로 검사하고, 어긋나면 어댑터가 한 번만 다시 생성한다.
 * 이름 횟수(6~8, 10~14)는 고유명사를 안정적으로 셀 수 없어 여기서 막지 않는다.
 */
export const IMAGE_HINTS = [
  'penthouse',
  'dressroom',
  'contract',
  'cafe',
  'coffee',
  'dinner',
  'wedding',
  'paris',
  'jeju',
  'yoga',
  'brunch',
  'drive',
] as const;

export type ImageHint = (typeof IMAGE_HINTS)[number];

export const ARIN_THEMES = [
  '합격',
  '내집',
  '커리어',
  '돈',
  '차',
  '사랑',
  '결혼',
  '건강',
  '여행',
  '자신감',
  '기타',
] as const;

export type ArinTheme = (typeof ARIN_THEMES)[number];

export const ARIN_PARAGRAPHS_MIN = 16;
export const ARIN_PARAGRAPHS_MAX = 20;
export const ARIN_SENTENCE_MAX = 60;
export const ARIN_TITLE_MAX = 30;
export const ARIN_AFFIRMATION_MAX = 40;
export const ARIN_AFFIRMATION_COUNT = 3;
/** 문단 문장을 이어 공백을 뺀 본문 길이. */
export const ARIN_BODY_MIN = 1400;
export const ARIN_BODY_MAX = 1600;

const QUOTE_WRAP = /^["“「『][\s\S]+["”」』]$/;

/** 문단을 문장으로 나눈다. 마침표·물음표·느낌표·말줄임 뒤의 공백이 경계다. */
export function splitSentences(paragraph: string): string[] {
  const parts = paragraph
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.length > 0 ? parts : [paragraph.trim()];
}

const sentenceSchema = z.string().trim().min(1).max(ARIN_SENTENCE_MAX);

export const arinStorySchema = z
  .object({
    title: z.string().trim().min(1).max(ARIN_TITLE_MAX),
    theme: z.enum(ARIN_THEMES),
    image_hint: z.enum(IMAGE_HINTS),
    paragraphs: z
      .array(z.array(sentenceSchema).min(1).max(3))
      .min(ARIN_PARAGRAPHS_MIN)
      .max(ARIN_PARAGRAPHS_MAX),
    affirmations: z
      .array(z.string().trim().min(1).max(ARIN_AFFIRMATION_MAX))
      .length(ARIN_AFFIRMATION_COUNT),
  })
  .superRefine((story, ctx) => {
    const last = story.paragraphs.at(-1);
    if (!last || last.length !== 1 || !QUOTE_WRAP.test(last[0] ?? '')) {
      ctx.addIssue({
        code: 'custom',
        path: ['paragraphs', story.paragraphs.length - 1],
        message: '마지막 문단은 따옴표로 감싼 확언 한 문장',
      });
    }
    const compact = story.paragraphs.flat().join('').replace(/\s/g, '').length;
    if (compact < ARIN_BODY_MIN || compact > ARIN_BODY_MAX) {
      ctx.addIssue({
        code: 'custom',
        path: ['paragraphs'],
        message: '본문은 공백 제외 1400~1600자',
      });
    }
  });

export type ArinStory = z.infer<typeof arinStorySchema>;

/** 음성에 넣을 본문. 한 문단의 문장은 이어 읽고, 문단 사이 빈 줄만 쉼이다. */
export function scriptFromArinStory(story: { paragraphs: readonly (readonly string[])[] }): string {
  return story.paragraphs.map((paragraph) => paragraph.join(' ')).join('\n\n');
}

/**
 * arin_story 컬럼이 없는 예전 이야기를 수정 요청에 넘길 때 쓴다.
 * 스키마를 통과하지 않아도 모델이 이전 글을 보게만 한다.
 */
export function fallbackArinStoryJson(input: {
  title: string | null;
  script: string | null;
  imageHint: string | null;
  affirmations: readonly string[] | null;
}) {
  const paragraphs = (input.script ?? '')
    .split(/\n\s*\n/)
    .map((paragraph) => splitSentences(paragraph))
    .filter((sentences) => sentences.some((sentence) => sentence.length > 0));
  return {
    title: input.title ?? '',
    theme: '기타' as const,
    image_hint: input.imageHint,
    paragraphs,
    affirmations: [...(input.affirmations ?? [])],
  };
}

/** 최근 이야기에서 반복을 피하려고 넣는 한 줄: 제목, 따옴표 대사, 마지막 확언. */
export function recentLineFromStory(story: {
  title: string | null;
  script: string | null;
  affirmations: readonly string[] | null;
}): string {
  const quotes = [...(story.script ?? '').matchAll(/["“「『]([^"”」』\n]{1,80})["”」』]/g)].map(
    (m) => m[1] ?? '',
  );
  return [story.title ?? '', ...quotes, story.affirmations?.at(-1) ?? ''].filter(Boolean).join(' ');
}

const SAMPLE_SENSES = [
  '나는 따뜻한 아침 빛 속에서 이 소원이 남긴 결을 손끝으로 천천히 느낀다.',
  '나는 창가에 앉아 이 소원이 바꾼 공기의 온기를 천천히 들이마신다.',
  '나는 그 결을 손바닥에 올리고 마음이 조용히 차오르는 것을 느낀다.',
] as const;

/**
 * 스키마를 통과하는 결정적 예시. mock 어댑터와 테스트가 같이 쓴다.
 * 17문단 × 3문장(공백 제외 86자) + 확언 한 문장 = 1,476자.
 */
export function sampleArinStory(): ArinStory {
  const paragraphs: string[][] = Array.from({ length: 17 }, () => [...SAMPLE_SENSES]);
  paragraphs.push(['"나는 이미 이 하루 안에 있다."']);
  return {
    title: '빛의 아침\n창을 연다',
    theme: '기타',
    image_hint: 'cafe',
    paragraphs,
    affirmations: ['나는 여기 있다.', '나는 충분하다.', '나는 천천히 간다.'],
  };
}
