import { describe, expect, it } from 'vitest';
import { estimateGeminiCostUsd, estimateTtsCostUsd, UnknownModelPriceError } from './pricing';

describe('pricing', () => {
  it('AI_PIPELINE 6절 예시와 같은 값을 낸다', () => {
    expect(estimateTtsCostUsd('eleven_v3', 3200)).toBe(0.32);
    expect(estimateTtsCostUsd('eleven_flash_v2_5', 700)).toBe(0.035);
    expect(estimateGeminiCostUsd('gemini-3-flash-preview', 9000, 7500)).toBe(0.027);
  });

  it('단가표에 없는 모델은 조용히 0을 내지 않고 에러를 던진다', () => {
    expect(() => estimateTtsCostUsd('unknown', 100)).toThrow(UnknownModelPriceError);
  });
});
