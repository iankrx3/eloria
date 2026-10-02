/**
 * 단위 원가(docs/AI_PIPELINE.md 6절, 2026-09 기준). 출시 전에 공식 가격표로 다시 확인한다.
 * 모델 ID는 환경 변수로 바뀌므로, 표에 없는 모델은 비용 0으로 계산하지 않고 에러를 던진다.
 */
export const GEMINI_PRICING_PER_MTOK: Record<string, { input: number; output: number }> = {
  'gemini-3-flash-preview': { input: 0.5, output: 3.0 },
};

export const ELEVENLABS_PRICING_PER_KCHAR: Record<string, number> = {
  eleven_v3: 0.1,
  eleven_flash_v2_5: 0.05,
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
