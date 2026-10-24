import type { SafetyVerdict, ScenePlan } from '@eloria/shared';
import {
  INJECTION_GUARD,
  toneBlock,
  userContextBlock,
  type PromptMessages,
  type StoryContext,
} from '../context';
import { REASON_LABEL } from '../safety/v1';

export const STORY_V1 = 'story@v1';

/** 낭독용 문단 하나의 대략적인 길이. 모델은 글자 수를 잘 못 세므로 문단 수로도 안내한다. */
const CHARS_PER_PARAGRAPH = 230;

const SYSTEM = `너는 Eloria의 오디오 스토리 작가다. 장면 계획을 바탕으로, 사용자가 이미 원하는 삶을 살고 있는 하루를 낭독용 한국어 스토리로 쓴다. 이 글은 그대로 음성으로 읽힌다.

## 문체
- 2인칭 존댓말 현재형으로 쓴다. 예: "당신은 커튼을 엽니다." 과거형이나 미래형으로 서술하지 않는다.
- 부를 이름이 있으면 전체에서 1~3회만, 문단 첫머리처럼 자연스러운 곳에서 이름 뒤에 "님"을 붙여 부른다. 예: "서아 님, 천천히 숨을 들이마셔 보세요." 이름이 없으면 "당신"으로 부른다.
- 문장은 짧게 쓴다. 한 문장에 한 동작이나 한 감각만 담아, 소리 내어 읽어도 숨이 차지 않게 한다.
- 빛, 소리, 온도, 향, 촉감으로 장면을 보여 주고, 감정은 몸의 반응과 행동으로 드러낸다.
- 결과보다 그 삶을 사는 감정, 태도, 일상 행동을 그린다. 금액, 직함, 순위를 강조하지 않는다.
- 다정하지만 과장하지 않는다. 이모지, 감탄사 남발, 광고 같은 문구를 쓰지 않는다.

## 낭독 표기
- 숫자는 읽는 대로 한글로 쓴다. 예: "10억" → "십억", "3시" → "세 시", "2층" → "이 층".
- 영어와 약어도 소리 나는 대로 한글로 쓴다. 예: "PT" → "피티", "UX" → "유엑스". 로마자를 쓰지 않는다.
- 기호(%, ~, &, /, #, *, 괄호)를 쓰지 않는다. 말줄임표 대신 쉼표나 문장 끝으로 쉼을 만든다.
- 제목, 소제목, 마크다운, 목록 기호 없이 본문만 쓴다.
- 문단 사이에 빈 줄 하나를 둔다. 빈 줄은 낭독의 쉼이 된다.

## 내용
- 장면 계획의 beats 순서를 따른다. beat 하나에 1~3문단.
- 사람은 장면 계획 people에 있는 사람만, 그 이름 그대로 쓴다. 이름 있는 새 인물을 만들지 않는다.
- 실존 인물, 브랜드 과시, 타인을 조종하거나 마음을 바꾸게 하는 내용을 쓰지 않는다. 연애는 "사랑받고 안정된 나"로 쓴다.
- 결과를 약속하지 않는다. "반드시 이루어집니다", "곧 이루어질 거예요" 같은 보장 표현, 투자나 의료에 관한 조언을 쓰지 않는다. 이 글은 이미 그 삶을 사는 하루를 상상해 보는 이야기다.
- "피할 것"은 어떤 형태로도 넣지 않는다.
- 마지막 문단은 감사와 정체성 문장으로 닫는다. identityStatements를 자연스럽게 녹이고, 듣는 사람을 다정하게 오늘로 돌려보내며 끝낸다.

${INJECTION_GUARD}`;

export type StoryPromptOptions = {
  targetChars: number;
  maxChars: number;
  /** 안전 검수가 rewrite로 돌려보낸 이유. 다시 쓸 때 같은 문제를 피하게 알려 준다. */
  safetyFeedback?: SafetyVerdict;
};

/** 스토리 작성 프롬프트(docs/AI_PIPELINE.md 4.2). 출력은 본문 텍스트만. */
export function storyPromptV1(
  plan: ScenePlan,
  ctx: StoryContext,
  opts: StoryPromptOptions,
): PromptMessages {
  const paragraphs = Math.max(4, Math.round(opts.targetChars / CHARS_PER_PARAGRAPH));
  const feedback = opts.safetyFeedback;
  return {
    system: SYSTEM,
    user: [
      `<scene_plan>\n${JSON.stringify(plan, null, 2)}\n</scene_plan>`,
      userContextBlock(ctx),
      toneBlock(ctx),
      `분량: 공백 포함 약 ${opts.targetChars}자, ${opts.maxChars}자를 넘기지 않는다. 대략 ${paragraphs}개 문단, 문단당 ${CHARS_PER_PARAGRAPH}자 안팎.`,
      ...(feedback && feedback.verdict !== 'pass'
        ? [
            `이전 초안은 안전 검수에서 다시 쓰기 판정을 받았다. 이유: ${feedback.reasons.map((r) => REASON_LABEL[r]).join(', ') || '기타'}. 이 문제가 없도록 새로 쓴다.`,
          ]
        : []),
      '스토리 본문만 출력한다.',
    ].join('\n\n'),
  };
}
