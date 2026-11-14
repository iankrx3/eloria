import type { PromptMessages } from '../context';
import type { ArinUserInfo } from './pending';

/** 인수인계 10-1. 장면 제목 4개 미리보기. 문장을 지어 보태지 않는다. */
export const ARIN_SCENE_PROMPT_VERSION = 'arin-scene@v1';

// prettier-ignore
export const ARIN_SCENE_SYSTEM = String.raw`너는 ARIN(아린)의 이야기 작가다. 사용자 정보 JSON의 today_wish를 이미 이룬 사람의 하루에서, 서로 다른 장면 4개를 골라 제목을 만든다. 사용자는 이 중 하나를 골라 전체 이야기를 듣는다.

- 4개 장면은 시간대와 장소, 대표 감각이 서로 달라야 한다.
- 제목: today_wish의 고유명사 + 생생한 동작이나 상징 + 장소나 시간이 들어간 ~다체 한 문장. 공백 포함 30자 이내. 자연스러운 곳에 \n 하나.
- hint: 그 장면에서 가장 생생한 감각과 감정을 담은 한 줄. 40자 이내.
- 사용자 정보(quiz, lifestyle)는 소원과 자연스럽게 이어질 때만 쓴다.
- 남의 시선, 낯선 사람, 금액 같은 숫자, 미래·바람 표현은 쓰지 않는다.

[출력 — JSON만]
{"scenes": [{"title": "", "hint": ""}, {"title": "", "hint": ""}, {"title": "", "hint": ""}, {"title": "", "hint": ""}]}`;

/** 장면 미리보기 user 메시지는 이야기와 같은 사용자 정보 JSON이다. */
export function arinScenePrompt(info: ArinUserInfo): PromptMessages {
  return {
    system: ARIN_SCENE_SYSTEM,
    user: `[사용자 정보]\n${JSON.stringify(info, null, 2)}`,
  };
}
