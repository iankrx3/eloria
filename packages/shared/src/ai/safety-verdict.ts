import { z } from 'zod';

/** 안전 검수 결과(docs/AI_PIPELINE.md 4.3). 꿈 입력과 생성 스크립트 모두 같은 분류를 쓴다. */
export const SAFETY_REASONS = [
  'guaranteed_outcome',
  'financial_advice',
  'medical_claim',
  'self_harm',
  'real_person',
  'manipulation',
  'sexual',
  'minor',
  'other',
] as const;

export const safetyVerdictSchema = z.object({
  verdict: z.enum(['pass', 'rewrite', 'block']),
  reasons: z.array(z.enum(SAFETY_REASONS)),
  notes: z.string().optional(),
});
export type SafetyVerdict = z.infer<typeof safetyVerdictSchema>;

/** 자해·위기 신호는 스토리를 만들지 않고 도움 안내 화면으로 보낸다(AI_PIPELINE 4.3). */
export function isCrisis(verdict: SafetyVerdict) {
  return verdict.reasons.includes('self_harm');
}
