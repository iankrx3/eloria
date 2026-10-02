/**
 * 프롬프트 템플릿은 `src/<name>/v<n>.ts`에 두고 `stories.prompt_version`에 `<name>@v<n>`을 기록한다
 * (docs/AI_PIPELINE.md 4절). scene-plan·story·safety v1은 M2에서 추가한다.
 */
export const PROMPT_VERSIONS = {} as const satisfies Record<string, `${string}@v${number}`>;
