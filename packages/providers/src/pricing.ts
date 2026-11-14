/**
 * 단위 원가(docs/AI_PIPELINE.md 6절, Gemini는 2026-11-12 공식 가격표 Standard 등급). 출시 전에 공식 가격표로 다시 확인한다.
 * 모델 ID는 환경 변수로 바뀌므로, 표에 없는 모델은 비용 0으로 계산하지 않고 에러를 던진다.
 */
export const GEMINI_PRICING_PER_MTOK: Record<string, { input: number; output: number }> = {
  'gemini-3-flash-preview': { input: 0.5, output: 3.0 },
  // 3.6·3.8 Flash는 2026-12-31까지 가격. 2027-01-01부터 입력 1.5·출력 7.5로 오른다.
  'gemini-3.6-flash': { input: 0.75, output: 3.75 },
  'gemini-3.8-flash': { input: 0.75, output: 3.75 },
  'gemini-3.5-flash-lite': { input: 0.3, output: 2.5 },
  'gemini-3.1-flash-lite': { input: 0.25, output: 1.5 },
};

/** API 단가(1,000자당 USD, 2026-11-14 elevenlabs.io/pricing/api). 유료 플랜의 API는 크레딧이 아니라 달러로 청구된다. */
export const ELEVENLABS_PRICING_PER_KCHAR: Record<string, number> = {
  eleven_v3: 0.08,
  eleven_multilingual_v2: 0.08,
  eleven_flash_v2_5: 0.04,
  eleven_turbo_v2_5: 0.04,
};

export class UnknownModelPriceError extends Error {
  constructor(public readonly model: string) {
    super(`단가표에 없는 모델입니다: ${model} (packages/providers/src/pricing.ts에 추가하세요)`);
    this.name = 'UnknownModelPriceError';
  }
}

const round5 = (usd: number) => Math.round(usd * 1e5) / 1e5;

export function estimateGeminiCostUsd(model: string, inputTokens: number, outputTokens: number) {
  const price = GEMINI_PRICING_PER_MTOK[model];
  if (!price) throw new UnknownModelPriceError(model);
  return round5((inputTokens * price.input + outputTokens * price.output) / 1_000_000);
}

export function estimateTtsCostUsd(model: string, chars: number) {
  const price = ELEVENLABS_PRICING_PER_KCHAR[model];
  if (price === undefined) throw new UnknownModelPriceError(model);
  return round5((chars / 1000) * price);
}
