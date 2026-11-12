import { LIFESTYLE_SUGGESTIONS, PERSONAL_ITEM_MAX } from '@eloria/shared';
import type { AffirmationContext } from '../affirmation/v1';
import { INJECTION_GUARD, userContextBlock, userText, type PromptMessages } from '../context';

export const LIFESTYLE_V1 = 'lifestyle@v1';

/** 라이프스타일 추천 맥락: 확언 맥락 + 사는 곳·하는 일 */
export type LifestyleContext = AffirmationContext & {
  location?: string | null;
  occupation?: string | null;
};

const SYSTEM = `너는 ARIN의 라이프스타일 큐레이터다. ARIN은 사용자가 원하는 삶을 "이미 그 삶을 사는 나"의 이야기로 들려주는 앱이다. 사용자 정보를 읽고, 그 사람이 꿈꾸는 삶에 어울리는 라이프스타일 키워드 ${LIFESTYLE_SUGGESTIONS}개를 JSON으로 만든다. 이 키워드는 이야기 속 장면에 자연스럽게 들어간다.

## 원칙
- 각 키워드는 ${PERSONAL_ITEM_MAX}자 이내의 짧은 한국어 명사구다(예: "느린 아침", "필라테스", "혼자 여행", "가족 중심", "주말 플리마켓").
- 사용자가 실제로 즐길 법한 일상의 습관·취향·공간·활동을 고른다. 꿈과 이유, 상상 속 아침과 하루에서 단서를 찾는다.
- 브랜드·상표, 실존 인물, 금액, 투자, 의료·질병·체중, 종교·정치, 성적 지향 같은 민감한 내용은 넣지 않는다.
- 사용자 정보의 "좋아하는 것"과 같은 키워드는 다시 쓰지 않는다. "피할 것"과 관련된 것은 넣지 않는다.
- 서로 겹치지 않게 다양하게 고른다.

${INJECTION_GUARD}`;

/** 라이프스타일 추천 프롬프트(마이 ↻). 응답 형식은 lifestyleSetSchema로 강제한다. */
export function lifestylePromptV1(ctx: LifestyleContext): PromptMessages {
  const extra = [
    ctx.location ? `사는 곳: ${userText(ctx.location, 40)}` : undefined,
    ctx.occupation ? `하는 일: ${userText(ctx.occupation, 40)}` : undefined,
  ].filter(Boolean);
  return {
    system: SYSTEM,
    user: [
      userContextBlock(ctx),
      ...(extra.length ? [`<user_context_extra>\n${extra.join('\n')}\n</user_context_extra>`] : []),
      `위 정보로 라이프스타일 키워드 ${LIFESTYLE_SUGGESTIONS}개를 JSON으로 만든다.`,
    ].join('\n\n'),
  };
}
