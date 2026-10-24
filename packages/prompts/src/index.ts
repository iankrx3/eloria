import { SAFETY_V1 } from './safety/v1';
import { SCENE_PLAN_V1 } from './scene-plan/v1';
import { STORY_V1 } from './story/v1';

/**
 * 프롬프트 템플릿은 `src/<name>/v<n>.ts`에 두고 버전을 올릴 때 새 파일을 만든다(docs/AI_PIPELINE.md 4절).
 * 지금 쓰는 버전만 여기서 내보낸다.
 */
export const PROMPT_VERSIONS = {
  scenePlan: SCENE_PLAN_V1,
  story: STORY_V1,
  safety: SAFETY_V1,
} as const satisfies Record<string, `${string}@v${number}`>;

/** stories.prompt_version에 기록하는 값. 세 프롬프트 중 하나만 바뀌어도 구분된다. */
export const STORY_PROMPT_VERSION = Object.values(PROMPT_VERSIONS).join('+');

export * from './checks';
export * from './context';
export * from './eval/cases';
export { safetyPromptV1, REASON_LABEL, type SafetyTarget } from './safety/v1';
export { scenePlanPromptV1 } from './scene-plan/v1';
export { storyPromptV1, type StoryPromptOptions } from './story/v1';
