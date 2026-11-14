import { z } from 'zod';
import { ProviderError } from '../gemini/gemini';
import { estimateTtsCostUsd } from '../pricing';
import type { TtsProvider } from '../types';
import { ELEVENLABS_MAX_CHARS, ttsCredits, type TtsCreditBudget } from './credits';

const BASE_URL = 'https://api.elevenlabs.io';
/** MP3 44.1kHz 128kbps(AI_PIPELINE 7절). 무료 플랜에서도 된다(192kbps는 Creator 이상). */
const OUTPUT_FORMAT = 'mp3_44100_128';
const BITRATE = 128_000;

type Fetch = typeof fetch;

/** 시드의 자리 보이스(`mock-*`)나 없는 값이면 기본 보이스를 쓴다. 실제 보이스는 Q-08 후 voices에 넣는다. */
export function isPlaceholderVoice(voiceId: string | null | undefined): boolean {
  return !voiceId || voiceId === 'default' || voiceId.startsWith('mock-');
}

/** 응답 본문에서 사람이 읽을 이유만 꺼낸다. 형식: `{ detail: { status, message } }` 또는 `{ detail: "..." }`. */
async function errorDetail(res: Response): Promise<{ status?: string; message: string }> {
  const raw = await res.text().catch(() => '');
  try {
    const body = JSON.parse(raw) as { detail?: unknown };
    const detail = body.detail;
    if (typeof detail === 'string') return { message: detail };
    if (detail && typeof detail === 'object') {
      const d = detail as { status?: unknown; message?: unknown };
      return {
        status: typeof d.status === 'string' ? d.status : undefined,
        message: typeof d.message === 'string' ? d.message : JSON.stringify(detail),
      };
    }
  } catch {
    // JSON이 아니면 원문 일부를 쓴다.
  }
  return { message: raw.slice(0, 200) || res.statusText };
}

/** 재시도해도 되는 응답: 요청 시간 초과·동시 요청 한도·서버 오류. quota_exceeded(401)는 재시도하지 않는다. */
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);

/**
 * ElevenLabs 음성(REST `POST /v1/text-to-speech/{voice_id}`).
 * - 호출 전에 크레딧 상한을 잡는다(회당·월, D-49). 넘으면 API를 부르지 않는다.
 * - 재시도: 408·429·5xx만, 최대 `maxRetries`회. 클라이언트 타임아웃은 재시도하지 않는다
 *   (서버가 이미 만들었으면 크레딧이 두 번 나가므로).
 * - 비용: `pricing.ts`의 API 단가로 계산하고, 사용량은 글자 수로 기록한다.
 */
export function createElevenLabsTts(opts: {
  apiKey: string;
  model: string;
  defaultVoiceId: string;
  budget: TtsCreditBudget;
  fetch?: Fetch;
  timeoutMs?: number;
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
  baseUrl?: string;
}): TtsProvider {
  const doFetch = opts.fetch ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 180_000;
  const maxRetries = opts.maxRetries ?? 2;
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const baseUrl = opts.baseUrl ?? BASE_URL;
  const { model } = opts;
  // 비용 계산이 안 되는 모델이면 시작할 때 바로 알린다(호출 뒤에 기록이 실패하지 않게).
  estimateTtsCostUsd(model, 0);

  return {
    model,
    resolveVoiceId: (voiceId) => (isPlaceholderVoice(voiceId) ? opts.defaultVoiceId : voiceId!),

    async synthesize({ text, voiceId }) {
      const chars = text.length;
      const maxChars = ELEVENLABS_MAX_CHARS[model];
      if (maxChars !== undefined && chars > maxChars) {
        throw new ProviderError(
          'TOO_LONG',
          `${model}는 요청당 ${maxChars}자까지입니다: ${chars}자`,
        );
      }
      await opts.budget.take(ttsCredits(model, chars));

      const url = `${baseUrl}/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${OUTPUT_FORMAT}`;
      const body = JSON.stringify({
        text,
        model_id: model,
        // Multilingual v2는 language_code를 받지 않는다(공식 문서).
        ...(!model.startsWith('eleven_multilingual') && { language_code: 'ko' }),
      });

      for (let attempt = 0; ; attempt += 1) {
        let res: Response;
        try {
          res = await doFetch(url, {
            method: 'POST',
            headers: {
              'xi-api-key': opts.apiKey,
              'content-type': 'application/json',
              accept: 'audio/mpeg',
            },
            body,
            signal: AbortSignal.timeout(timeoutMs),
          });
        } catch (error) {
          const name = error instanceof Error ? error.name : '';
          throw new ProviderError(
            'UPSTREAM',
            name === 'TimeoutError'
              ? `elevenlabs 응답 시간 초과(${timeoutMs}ms)`
              : `elevenlabs 연결 실패: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        if (res.ok) {
          const audio = new Uint8Array(await res.arrayBuffer());
          if (audio.byteLength === 0) throw new ProviderError('BAD_OUTPUT', 'elevenlabs: 빈 음성');
          return {
            audio,
            mime: 'audio/mpeg',
            // 고정 비트레이트(CBR) MP3라 길이 = 비트 수 / 비트레이트
            durationSec: (audio.byteLength * 8) / BITRATE,
            usage: {
              provider: 'elevenlabs',
              model,
              ttsChars: chars,
              estCostUsd: estimateTtsCostUsd(model, chars),
            },
          };
        }

        if (RETRYABLE.has(res.status) && attempt < maxRetries) {
          await res.body?.cancel().catch(() => undefined);
          await sleep(1000 * 2 ** attempt);
          continue;
        }
        const detail = await errorDetail(res);
        const message = `elevenlabs ${res.status}${detail.status ? ` ${detail.status}` : ''}: ${detail.message.slice(0, 200)}`;
        if (detail.status === 'quota_exceeded') throw new ProviderError('BUDGET_EXCEEDED', message);
        if (res.status === 429) throw new ProviderError('RATE_LIMITED', message);
        throw new ProviderError('UPSTREAM', message);
      }
    },
  };
}

const subscriptionSchema = z.object({
  tier: z.string(),
  character_count: z.number(),
  character_limit: z.number(),
  next_character_count_reset_unix: z.number().nullable().optional(),
});
export type ElevenLabsSubscription = z.infer<typeof subscriptionSchema>;

const voicesSchema = z.object({
  voices: z.array(
    z.object({
      voice_id: z.string(),
      name: z.string(),
      category: z.string().nullable().optional(),
      labels: z.record(z.string(), z.string().nullable()).nullable().optional(),
    }),
  ),
});
export type ElevenLabsVoice = z.infer<typeof voicesSchema>['voices'][number];

/** 크레딧이 들지 않는 조회(사용량·보이스 목록). 확인 스크립트용. */
export function createElevenLabsAccount(opts: { apiKey: string; fetch?: Fetch; baseUrl?: string }) {
  const doFetch = opts.fetch ?? fetch;
  const baseUrl = opts.baseUrl ?? BASE_URL;
  async function get<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    const res = await doFetch(`${baseUrl}${path}`, {
      headers: { 'xi-api-key': opts.apiKey },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      const detail = await errorDetail(res);
      throw new ProviderError(
        'UPSTREAM',
        `elevenlabs ${res.status}${detail.status ? ` ${detail.status}` : ''}: ${detail.message.slice(0, 200)}`,
      );
    }
    return schema.parse(await res.json());
  }
  return {
    subscription: () => get('/v1/user/subscription', subscriptionSchema),
    voices: async () => (await get('/v1/voices', voicesSchema)).voices,
  };
}
