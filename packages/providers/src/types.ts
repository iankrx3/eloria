import type { SafetyTarget, StoryContext } from '@eloria/prompts';
import type { SafetyVerdict, ScenePlan } from '@eloria/shared';

export type { SafetyTarget, StoryContext };

/** 호출 1회의 사용량과 추정 비용. generation_jobs에 그대로 기록한다(CLAUDE.md 권한·원가). */
export type Usage = {
  provider: 'gemini' | 'elevenlabs' | 'mock';
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  ttsChars?: number;
  estCostUsd: number;
};

export interface StoryModel {
  planScenes(ctx: StoryContext): Promise<{ plan: ScenePlan; usage: Usage }>;
  writeStory(
    plan: ScenePlan,
    ctx: StoryContext,
    opts: {
      targetChars: number;
      maxChars: number;
      /** 검수가 rewrite로 돌려보낸 이유. 다시 쓸 때만 넘긴다. */
      safetyFeedback?: SafetyVerdict;
    },
  ): Promise<{ script: string; usage: Usage }>;
  /** 꿈 입력과 생성된 스크립트는 판정 기준이 다르다(AI_PIPELINE 4.3). */
  reviewSafety(
    text: string,
    target: SafetyTarget,
  ): Promise<{ verdict: SafetyVerdict; usage: Usage }>;
  /** 어댑터가 쓰는 프롬프트 버전(stories.prompt_version) */
  readonly promptVersion: string;
}

export interface TtsProvider {
  /** 음성 모델 ID. 캐시 키와 비용 계산에 쓴다. */
  readonly model: string;
  synthesize(input: { text: string; voiceId: string }): Promise<{
    audio: Uint8Array;
    mime: 'audio/mpeg' | 'audio/wav';
    durationSec: number;
    usage: Usage;
  }>;
}

export type Providers = { story: StoryModel; tts: TtsProvider };
