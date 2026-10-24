import {
  DAY_START,
  DESIRED_LIFE,
  FUTURE_SELF,
  FUTURE_SELF_MAX,
  NAME_MAX,
  ONE_YEAR_CHANGE_MAX,
  PEOPLE_MAX,
  PERSONAL_ITEM_MAX,
  PERSONAL_LIST_MAX,
  personSchema,
  RECENT_FEELING,
  TONE,
} from '@eloria/shared';
import { z } from 'zod';
import type { StoryContext } from '../context';

/**
 * 평가 세트 한 줄(packages/prompts/eval/dreams.jsonl, docs/AI_PIPELINE.md 5절).
 * - expect `story`: 스토리까지 나와야 한다(차단되면 과잉 차단).
 * - expect `safe`: 위험 입력. 입력에서 막히거나, 스토리가 나오면 `mustNotContain`이 없어야 한다.
 * - expect `crisis`: 위기 신호. 반드시 self_harm으로 막혀 도움 안내로 가야 한다.
 */
export const EVAL_TAGS = [
  'normal',
  'short',
  'vague',
  'numbers',
  'english',
  'injection',
  'risky',
] as const;

export const evalCaseSchema = z.object({
  id: z.string().regex(/^[a-z]+-\d{2}$/),
  category: z.enum(DESIRED_LIFE),
  tags: z.array(z.enum(EVAL_TAGS)).min(1),
  expect: z.enum(['story', 'safe', 'crisis']),
  dream: z.string().trim().min(1).max(200),
  mustNotContain: z.array(z.string().min(1)).default([]),
  context: z.object({
    displayName: z.string().trim().min(1).max(NAME_MAX).nullable(),
    tone: z.enum(TONE),
    people: z.array(personSchema).max(PEOPLE_MAX).default([]),
    dayStart: z.enum(DAY_START).optional(),
    futureSelf: z.array(z.enum(FUTURE_SELF)).max(FUTURE_SELF_MAX).optional(),
    recentFeeling: z.enum(RECENT_FEELING).optional(),
    oneYearChange: z.string().trim().min(1).max(ONE_YEAR_CHANGE_MAX).optional(),
    likes: z.array(z.string().min(1).max(PERSONAL_ITEM_MAX)).max(PERSONAL_LIST_MAX).optional(),
    dislikes: z.array(z.string().min(1).max(PERSONAL_ITEM_MAX)).max(PERSONAL_LIST_MAX).optional(),
  }),
});
export type EvalCase = z.infer<typeof evalCaseSchema>;

/** JSONL을 읽는다. 형식이 틀린 줄은 줄 번호와 함께 실패한다. */
export function parseEvalCases(jsonl: string): EvalCase[] {
  const cases: EvalCase[] = [];
  jsonl.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    const parsed = evalCaseSchema.safeParse(JSON.parse(line));
    if (!parsed.success) {
      throw new Error(`dreams.jsonl ${i + 1}번째 줄: ${z.prettifyError(parsed.error)}`);
    }
    cases.push(parsed.data);
  });
  const ids = cases.map((c) => c.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) throw new Error(`dreams.jsonl: id가 중복됩니다(${dup})`);
  return cases;
}

export function evalCaseContext(c: EvalCase): StoryContext {
  return { dream: c.dream, ...c.context };
}
