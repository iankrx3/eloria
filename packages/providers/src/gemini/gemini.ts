import {
  AFFIRMATION_V1,
  affirmationPromptV1,
  lifestylePromptV1,
  STORY_PROMPT_VERSION,
  safetyPromptV1,
  scenePlanPromptV2,
  visionPromptV1,
  storyPromptV1,
  type PromptMessages,
} from '@eloria/prompts';
import {
  affirmationSetSchema,
  lifestyleSetSchema,
  safetyVerdictSchema,
  scenePlanSchema,
  visionSetSchema,
} from '@eloria/shared';
import { ApiError, GoogleGenAI, ThinkingLevel } from '@google/genai';
import { z } from 'zod';
import { estimateGeminiCostUsd } from '../pricing';
import type { AffirmationModel, LifestyleModel, StoryModel, Usage, VisionModel } from '../types';

/** 공급자 호출 실패. code로 재시도·사용자 안내를 고른다. */
export class ProviderError extends Error {
  constructor(
    public readonly code:
      'BUDGET_EXCEEDED' | 'RATE_LIMITED' | 'UPSTREAM' | 'BAD_OUTPUT' | 'TOO_LONG',
    message: string,
  ) {
    // Inngest가 에러를 직렬화해도 종류를 알 수 있게 메시지 앞에 code를 붙인다.
    super(`[${code}] ${message}`);
    this.name = 'ProviderError';
  }
}

export type GeminiRequest = {
  model: string;
  messages: PromptMessages;
  /** 있으면 JSON으로만 답하게 한다(구조화 출력). */
  jsonSchema?: unknown;
  thinking: 'minimal' | 'low' | 'medium';
  maxOutputTokens: number;
};

export type GeminiResponse = { text: string; promptTokens: number; outputTokens: number };

/** Gemini 호출 1회. 테스트에서는 가짜 함수로 바꾼다. */
export type GeminiGenerate = (req: GeminiRequest) => Promise<GeminiResponse>;

/**
 * 호출 전에 하루 상한을 확인한다(무료 쿼터 보호, D-45). 넘으면 BUDGET_EXCEEDED를 던진다.
 * 기록은 호출한 쪽이 generation_jobs에 남기고, 상한은 그 기록으로 센다.
 */
export interface CallBudget {
  take(): Promise<void>;
}

const THINKING: Record<GeminiRequest['thinking'], ThinkingLevel> = {
  minimal: ThinkingLevel.MINIMAL,
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
};

/**
 * `@google/genai` 호출. 재시도(408·429·5xx, 최대 3회)와 타임아웃은 SDK의 httpOptions로 맡긴다.
 * 출력 토큰에는 생각(thinking) 토큰을 더한다. 같은 단가로 청구된다.
 */
export function createGenAiGenerate(opts: { apiKey: string; timeoutMs?: number }): GeminiGenerate {
  const ai = new GoogleGenAI({
    apiKey: opts.apiKey,
    httpOptions: {
      timeout: opts.timeoutMs ?? 60_000,
      retryOptions: {
        attempts: 3,
        initialDelay: 2,
        httpStatusCodes: [408, 429, 500, 502, 503, 504],
      },
    },
  });
  return async (req) => {
    try {
      const res = await ai.models.generateContent({
        model: req.model,
        contents: req.messages.user,
        config: {
          systemInstruction: req.messages.system,
          maxOutputTokens: req.maxOutputTokens,
          thinkingConfig: { thinkingLevel: THINKING[req.thinking] },
          ...(req.jsonSchema !== undefined && {
            responseMimeType: 'application/json',
            responseJsonSchema: req.jsonSchema,
          }),
        },
      });
      const usage = res.usageMetadata;
      return {
        text: res.text ?? '',
        promptTokens: usage?.promptTokenCount ?? 0,
        outputTokens: (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0),
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ProviderError(
          error.status === 429 ? 'RATE_LIMITED' : 'UPSTREAM',
          `gemini ${error.status}: ${error.message.slice(0, 200)}`,
        );
      }
      throw new ProviderError('UPSTREAM', error instanceof Error ? error.message : String(error));
    }
  };
}

export type GeminiModels = { story: string; safety: string };

/** 장면 계획·스토리·검수 출력 상한(생각 토큰 포함). 스토리 3,800자 ≈ 3,000토큰 + 여유. */
const MAX_OUTPUT = {
  plan: 4_000,
  story: 8_000,
  safety: 1_000,
  affirmation: 2_000,
  lifestyle: 600,
  vision: 1_500,
} as const;

/**
 * 공통 실행: 상한 확인 → 호출 → (JSON이면) 스키마 검증. 형식이 틀리면 한 번만 다시 부른다.
 * 실패한 호출도 토큰을 쓰므로 다시 부를 때도 상한을 다시 확인한다.
 */
export function createGeminiRunner(generate: GeminiGenerate, budget?: CallBudget) {
  async function once(req: GeminiRequest): Promise<{ res: GeminiResponse; usage: Usage }> {
    await budget?.take();
    const res = await generate(req);
    return {
      res,
      usage: {
        provider: 'gemini',
        model: req.model,
        inputTokens: res.promptTokens,
        outputTokens: res.outputTokens,
        estCostUsd: estimateGeminiCostUsd(req.model, res.promptTokens, res.outputTokens),
      },
    };
  }

  /** 두 번 부르면 두 번 쓴 토큰을 합쳐 기록한다. */
  const sum = (a: Usage, b: Usage): Usage => ({
    ...b,
    inputTokens: (a.inputTokens ?? 0) + (b.inputTokens ?? 0),
    outputTokens: (a.outputTokens ?? 0) + (b.outputTokens ?? 0),
    estCostUsd: Math.round((a.estCostUsd + b.estCostUsd) * 1e5) / 1e5,
  });

  return {
    async text(req: Omit<GeminiRequest, 'jsonSchema'>) {
      const { res, usage } = await once(req);
      const text = res.text.trim();
      if (!text) throw new ProviderError('BAD_OUTPUT', `${req.model}: 빈 응답`);
      return { text, usage };
    },
    async json<S extends z.ZodType>(schema: S, req: Omit<GeminiRequest, 'jsonSchema'>) {
      const full = { ...req, jsonSchema: z.toJSONSchema(schema) };
      const parse = (text: string) => {
        try {
          return schema.safeParse(JSON.parse(text));
        } catch {
          return { success: false as const };
        }
      };
      const first = await once(full);
      const a = parse(first.res.text);
      if (a.success) return { value: a.data as z.infer<S>, usage: first.usage };
      const second = await once(full);
      const b = parse(second.res.text);
      if (b.success) return { value: b.data as z.infer<S>, usage: sum(first.usage, second.usage) };
      throw new ProviderError('BAD_OUTPUT', `${req.model}: 스키마에 맞지 않는 JSON`);
    },
  };
}

/** 스토리 모델(장면 계획·작성·검수) live 어댑터 */
export function createGeminiStoryModel(opts: {
  generate: GeminiGenerate;
  models: GeminiModels;
  budget?: CallBudget;
}): StoryModel {
  const run = createGeminiRunner(opts.generate, opts.budget);
  const { story, safety } = opts.models;
  return {
    promptVersion: STORY_PROMPT_VERSION,
    async planScenes(ctx) {
      const { value, usage } = await run.json(scenePlanSchema, {
        model: story,
        messages: scenePlanPromptV2(ctx),
        thinking: 'low',
        maxOutputTokens: MAX_OUTPUT.plan,
      });
      return { plan: value, usage };
    },
    async writeStory(plan, ctx, limits) {
      const { text, usage } = await run.text({
        model: story,
        messages: storyPromptV1(plan, ctx, limits),
        thinking: 'low',
        maxOutputTokens: MAX_OUTPUT.story,
      });
      return { script: text, usage };
    },
    async reviewSafety(text, target) {
      const { value, usage } = await run.json(safetyVerdictSchema, {
        model: safety,
        messages: safetyPromptV1({ target, text }),
        thinking: 'minimal',
        maxOutputTokens: MAX_OUTPUT.safety,
      });
      return { verdict: value, usage };
    },
  };
}

/** 오늘의 확언 live 어댑터. 짧은 글이라 story 모델을 생각 최소로 쓴다. */
export function createGeminiAffirmationModel(opts: {
  generate: GeminiGenerate;
  model: string;
  budget?: CallBudget;
}): AffirmationModel {
  const run = createGeminiRunner(opts.generate, opts.budget);
  return {
    promptVersion: AFFIRMATION_V1,
    async writeAffirmations(ctx, o = {}) {
      const { value, usage } = await run.json(affirmationSetSchema, {
        model: opts.model,
        messages: affirmationPromptV1(ctx, o),
        thinking: 'low',
        maxOutputTokens: MAX_OUTPUT.affirmation,
      });
      return { set: value, usage };
    },
  };
}

/** 라이프스타일 추천 live 어댑터. 짧은 키워드라 생각 최소. */
export function createGeminiLifestyleModel(opts: {
  generate: GeminiGenerate;
  model: string;
  budget?: CallBudget;
}): LifestyleModel {
  const run = createGeminiRunner(opts.generate, opts.budget);
  return {
    async suggest(ctx) {
      const { value, usage } = await run.json(lifestyleSetSchema, {
        model: opts.model,
        messages: lifestylePromptV1(ctx),
        thinking: 'minimal',
        maxOutputTokens: MAX_OUTPUT.lifestyle,
      });
      return { set: value, usage };
    },
  };
}

/** 비전 장면 제안 live 어댑터(한 번 호출로 4개) */
export function createGeminiVisionModel(opts: {
  generate: GeminiGenerate;
  model: string;
  budget?: CallBudget;
}): VisionModel {
  const run = createGeminiRunner(opts.generate, opts.budget);
  return {
    async suggest(ctx) {
      const { value, usage } = await run.json(visionSetSchema, {
        model: opts.model,
        messages: visionPromptV1(ctx),
        thinking: 'low',
        maxOutputTokens: MAX_OUTPUT.vision,
      });
      return { set: value, usage };
    },
  };
}
