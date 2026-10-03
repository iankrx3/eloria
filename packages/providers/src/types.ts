import type { SafetyVerdict, ScenePlan } from '@eloria/shared';

/** 호출 1회의 사용량과 추정 비용. generation_jobs에 그대로 기록한다(CLAUDE.md 권한·원가). */
export type Usage = {
  provider: 'gemini' | 'elevenlabs' | 'mock';
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  ttsChars?: number;
  estCostUsd: number;
};

/** 스토리 생성에 쓰는 사용자 맥락. 감정 문항은 톤 조절에만 쓴다(PRD 5절). */
export type StoryContext = {
  dream: string;
  displayName: string | null;
  tone: 'calm' | 'excited' | 'powerful';
  people: { name: string; relation: string }[];
  dayStart?: string;
  futureSelf?: string[];
  recentFeeling?: string;
  oneYearChange?: string;
};

export interface StoryModel {
  planScenes(ctx: StoryContext): Promise<{ plan: ScenePlan; usage: Usage }>;
  writeStory(
    plan: ScenePlan,
    ctx: StoryContext,
    opts: { targetChars: number; maxChars: number },
  ): Promise<{ script: string; usage: Usage }>;
  reviewSafety(text: string): Promise<{ verdict: SafetyVerdict; usage: Usage }>;
  /** 어댑터가 쓰는 프롬프트 버전(stories.prompt_version) */
  readonly promptVersion: string;
}

export interface TtsProvider {
  /** 음성 모델 ID. 캐시 키와 비용 계산에 쓴다. */
  readonly model: string;
  synthesize(input: {
    text: string;
    voiceId: string;
  }): Promise<{
    audio: Uint8Array;
    mime: 'audio/mpeg' | 'audio/wav';
    durationSec: number;
    usage: Usage;
  }>;
}

export type Providers = { story: StoryModel; tts: TtsProvider };
