import type { SafetyVerdict, ScenePlan } from '@eloria/shared';
import type { Providers, StoryContext, Usage } from '../types';
import { chimeWav } from './chime-wav';

const usage = (extra: Partial<Usage> = {}): Usage => ({
  provider: 'mock',
  model: 'mock',
  estCostUsd: 0,
  ...extra,
});

/** 위기 신호가 있는 입력으로 차단 경로를 시험할 수 있게 한다. 실제 검수는 Gemini가 한다. */
const CRISIS_PATTERN = /죽고\s*싶|자해|사라지고\s*싶/;

const PLACES: Record<string, string> = {
  seoul_city: '서울 도심의 높은 창가',
  seaside: '파도 소리가 들리는 바닷가 집',
  abroad: '낯설지만 편안한 해외 도시의 골목',
  nature: '숲이 내려다보이는 조용한 집',
};

function planFor(ctx: StoryContext): ScenePlan {
  const place = PLACES[ctx.dayStart ?? ''] ?? '햇살이 드는 나의 공간';
  return {
    title: ctx.dream.slice(0, 12),
    goal: ctx.dream,
    setting: { place, timeOfDay: 'morning' },
    beats: [
      {
        kind: 'arrival',
        description: `${place}에서 눈을 뜬다`,
        sensoryDetails: ['부드러운 햇살', '따뜻한 이불'],
      },
      {
        kind: 'situation',
        description: `${ctx.dream}이 이미 일상이 되었다`,
        sensoryDetails: ['익숙한 공기', '조용한 음악'],
      },
      {
        kind: 'emotion',
        description: '가슴이 차분하게 차오른다',
        sensoryDetails: ['깊은 숨', '느린 심장 박동'],
      },
      {
        kind: 'daily_life',
        description: '하루를 여유롭게 시작한다',
        sensoryDetails: ['커피 향', '창밖 풍경'],
      },
      {
        kind: 'gratitude',
        description: '오늘에 감사한다',
        sensoryDetails: ['포근한 손끝', '잔잔한 미소'],
      },
    ],
    identityStatements: [
      '나는 나의 하루를 아끼는 사람입니다.',
      '나는 원하는 삶을 살아가는 사람입니다.',
    ],
    people: ctx.people.map((p) => ({ name: p.name, role: p.relation })),
    imagePrompt:
      'warm film tone, sunlit room by a window, silhouette from behind, no text, no logo',
    tone: ctx.tone,
  };
}

function scriptFor(plan: ScenePlan, ctx: StoryContext): string {
  const name = ctx.displayName ?? '당신';
  const with_ = plan.people[0]
    ? `\n\n${plan.people[0].name}의 웃음소리가 가까이에서 들립니다. 함께하는 아침이 당연한 듯 편안합니다.`
    : '';
  return [
    `${name}, 천천히 눈을 떠 보세요. ${plan.setting.place}에 부드러운 햇살이 스며듭니다.`,
    `${plan.goal}. 이제 그것은 먼 꿈이 아니라 당신이 살아가는 하루의 풍경입니다.`,
    '깊게 숨을 들이마십니다. 익숙한 공기, 잔잔한 음악, 그리고 아무것도 서두르지 않아도 되는 여유.',
    '따뜻한 커피를 내리고 창밖을 바라봅니다. 오늘 해야 할 일들이 설렘으로 다가옵니다.' + with_,
    `${name}, 당신은 지금 이 하루를 충분히 누리고 있습니다.`,
    ...(ctx.likes?.length
      ? [
          `좋아하는 것들, ${ctx.likes.slice(0, 3).join(', ')}. 오늘 하루에도 자연스럽게 곁에 있습니다.`,
        ]
      : []),
    plan.identityStatements.join(' '),
    '오늘도 그 하루를 살아 봐요. 고맙습니다, 이 아침에게, 그리고 당신 자신에게.',
  ].join('\n\n');
}

/**
 * 외부 API를 부르지 않는 mock 어댑터(PROVIDER_MODE=mock, D-15).
 * 결과는 입력에 따라 결정적이고 비용은 0이다.
 */
export function createMockProviders(opts: { delayMs?: number } = {}): Providers {
  const wait = () => new Promise((r) => setTimeout(r, opts.delayMs ?? 0));

  return {
    story: {
      promptVersion: 'mock@v0',
      async planScenes(ctx) {
        await wait();
        return { plan: planFor(ctx), usage: usage({ inputTokens: 0, outputTokens: 0 }) };
      },
      async writeStory(plan, ctx) {
        await wait();
        return { script: scriptFor(plan, ctx), usage: usage({ inputTokens: 0, outputTokens: 0 }) };
      },
      async reviewSafety(text) {
        await wait();
        const verdict: SafetyVerdict = CRISIS_PATTERN.test(text)
          ? { verdict: 'block', reasons: ['self_harm'] }
          : { verdict: 'pass', reasons: [] };
        return { verdict, usage: usage() };
      },
    },
    tts: {
      // 모델 이름이 음성 캐시 키에 들어간다. 소리 형식을 바꾸면 이름도 바꿔 예전 파일을 재사용하지 않게 한다.
      model: 'mock-chime',
      async synthesize({ text }) {
        await wait();
        // 실제 낭독 속도(한국어 약 초당 7자)를 흉내 내되 개발 중 파일이 커지지 않게 60초로 자른다.
        const { bytes, durationSec } = chimeWav(Math.min(60, Math.max(5, text.length / 7)));
        return {
          audio: bytes,
          mime: 'audio/wav',
          durationSec,
          usage: usage({ model: 'mock-chime', ttsChars: text.length }),
        };
      },
    },
  };
}
