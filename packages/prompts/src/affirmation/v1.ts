import { AFFIRMATION_TEXT_MAX, AFFIRMATION_THEME_MAX, AFFIRMATIONS_PER_DAY } from '@eloria/shared';
import type { SafetyVerdict } from '@eloria/shared';
import {
  INJECTION_GUARD,
  userContextBlock,
  userText,
  type PromptMessages,
  type StoryContext,
} from '../context';
import { REASON_LABEL } from '../safety/v1';

export const AFFIRMATION_V1 = 'affirmation@v1';

const CHANGE_LABEL: Record<string, string> = {
  wealth: '풍요',
  love: '사랑',
  career: '커리어',
  home: '나만의 집',
  health: '건강한 몸과 마음',
  travel: '여행',
  family: '가족',
  self_love: '나를 사랑하기',
};

/** 확언 맥락: 스토리 맥락 + 걸림돌·바라는 변화(퀴즈·목표 수정) */
export type AffirmationContext = StoryContext & {
  /** 퀴즈 "지금 가장 큰 걸림돌"(desire_blocker) */
  blocker?: string;
  /** 목표 수정 "바라는 변화"(DESIRED_CHANGES 키) */
  changes?: string[];
};

const SYSTEM = `너는 ARIN의 확언 작가다. ARIN은 사용자가 원하는 삶을 "이미 그 삶을 사는 나"로 상상하게 돕는 앱이다. 사용자 정보를 읽고 오늘 하루 한 장씩 넘겨 볼 확언 ${AFFIRMATIONS_PER_DAY}개를 JSON으로 만든다.

## 원칙
- 1인칭 현재형 한국어 문장이다. "나는 ~", "내 ~" 처럼 이미 그런 사람인 것처럼 말한다. 존댓말이 아닌 평서형(~다, ~한다)으로 쓴다.
- 한 문장, ${AFFIRMATION_TEXT_MAX}자 이내. 쉬운 단어, 따라 말하기 좋은 리듬.
- 결과(금액, 합격, 직함, 특정인의 마음)를 약속하거나 보장하지 않는다. "반드시", "꼭 이루어진다", "100%" 같은 말을 쓰지 않는다. 그 삶을 사는 사람의 태도, 감정, 선택, 일상 행동을 말한다.
- 투자·종목·코인·수익률, 치료·완치·약·체중 수치, 실존 인물, 특정인을 바꾸려는 말은 넣지 않는다.
- 걸림돌이 있으면 그 걸림돌을 직접 꾸짖거나 부정하지 말고, 그 반대편에 선 나의 모습으로 2~3개를 부드럽게 바꿔 말한다(예: 걸림돌 "자신감이 없어요" → "나는 내 속도로 충분히 잘 해내고 있다").
- ${AFFIRMATIONS_PER_DAY}개는 서로 겹치지 않게 섞는다: 꿈과 이어진 것 4~5개, 자기 존중·마음의 평온 3~4개, 감사 1~2개.
- 이름, 함께하는 사람은 자연스러울 때만 한두 번 쓴다. "피할 것"은 어떤 형태로도 넣지 않는다.
- theme: 그 확언을 한마디로 줄인 ${AFFIRMATION_THEME_MAX}자 이내 한국어 구절(예: "나는 충분한 사람", "사랑받는 나", "평온", "용기").

${INJECTION_GUARD}`;

/** 오늘의 확언 프롬프트. 응답 형식은 affirmationSetSchema로 강제한다. */
export function affirmationPromptV1(
  ctx: AffirmationContext,
  opts: { safetyFeedback?: SafetyVerdict } = {},
): PromptMessages {
  const extra = [
    ctx.blocker ? `지금 가장 큰 걸림돌: ${userText(ctx.blocker)}` : undefined,
    ctx.changes?.some((c) => CHANGE_LABEL[c])
      ? `바라는 변화: ${ctx.changes
          .map((c) => CHANGE_LABEL[c])
          .filter(Boolean)
          .join(', ')}`
      : undefined,
  ].filter(Boolean);
  const feedback = opts.safetyFeedback;
  return {
    system: SYSTEM,
    user: [
      userContextBlock(ctx),
      ...(extra.length ? [`<user_context_extra>\n${extra.join('\n')}\n</user_context_extra>`] : []),
      ...(feedback && feedback.verdict !== 'pass'
        ? [
            `이전 확언은 안전 검수에서 다시 쓰라는 판정을 받았다. 이유: ${feedback.reasons
              .map((r) => REASON_LABEL[r])
              .join(', ')}. 같은 문제가 없도록 처음부터 다시 쓴다.`,
          ]
        : []),
      `위 정보로 오늘의 확언 ${AFFIRMATIONS_PER_DAY}개를 JSON으로 만든다.`,
    ].join('\n\n'),
  };
}

/**
 * 생성·검수가 끝내 실패했을 때 보여 줄 기본 확언(AI 없이). 누구에게나 맞는 태도·감정 중심 문장이다.
 * 문구는 임시값(ROADMAP 열린 질문 Q-16).
 */
export const FALLBACK_AFFIRMATIONS: readonly { text: string; theme: string }[] = [
  { text: '나는 오늘 하루를 내 속도로 살아간다.', theme: '평온' },
  { text: '나는 원하는 삶을 매일 조금씩 선택하고 있다.', theme: '자기 확신' },
  { text: '내 안에는 이미 충분한 힘이 있다.', theme: '용기' },
  { text: '나는 나를 다정하게 대하는 사람이다.', theme: '자기 존중' },
  { text: '좋은 일은 내가 알아차릴 때 더 선명해진다.', theme: '감사' },
  { text: '나는 오늘 할 수 있는 한 가지에 마음을 쓴다.', theme: '집중' },
  { text: '나는 사랑받을 자격이 있는 사람이다.', theme: '사랑' },
  { text: '나는 불안 대신 숨 한 번을 고른다.', theme: '평온' },
  { text: '나는 어제보다 조금 더 나를 믿는다.', theme: '자기 확신' },
  { text: '오늘 내 곁에 있는 것들에 고맙다.', theme: '감사' },
];
