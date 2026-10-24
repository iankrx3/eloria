/**
 * 생성된 스크립트의 기계적 점검(docs/AI_PIPELINE.md 4.2 규칙 중 코드로 확인할 수 있는 것).
 * 안전 검수를 대신하지 않는다. 평가 세트 리포트와 회귀 확인에 쓴다.
 */
export type ScriptIssueCode =
  | 'too_short'
  | 'too_long'
  | 'digits'
  | 'latin'
  | 'symbols'
  | 'markdown'
  | 'emoji'
  | 'name_count'
  | 'guarantee_phrase'
  | 'disliked_item';

export type ScriptIssue = { code: ScriptIssueCode; detail: string };

export type ScriptCheck = { chars: number; paragraphs: number; issues: ScriptIssue[] };

/** 목표의 이 비율보다 짧으면 5분 분량에 못 미친다고 본다. */
const MIN_RATIO = 0.75;

const GUARANTEE_PATTERNS = [
  /반드시\s*(이루어|이뤄)/,
  /(곧|꼭|분명히?|틀림없이|확실히)\s*(이루어|이뤄)/,
  /무조건/,
  /보장/,
  /100\s*(%|퍼센트|프로)/,
];

const uniqueMatches = (text: string, re: RegExp, max = 5) =>
  [...new Set(text.match(re) ?? [])].slice(0, max).join(', ');

export function checkScript(
  script: string,
  opts: {
    targetChars: number;
    maxChars: number;
    displayName?: string | null;
    dislikes?: readonly string[];
  },
): ScriptCheck {
  const chars = script.length;
  const paragraphs = script.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const issues: ScriptIssue[] = [];
  const add = (code: ScriptIssueCode, detail: string) => issues.push({ code, detail });

  if (chars < opts.targetChars * MIN_RATIO)
    add('too_short', `${chars}자 (목표 ${opts.targetChars}자)`);
  if (chars > opts.maxChars) add('too_long', `${chars}자 (상한 ${opts.maxChars}자)`);

  if (/[0-9０-９]/.test(script)) add('digits', uniqueMatches(script, /[0-9０-９][0-9０-９,.]*/g));
  if (/[A-Za-z]/.test(script)) add('latin', uniqueMatches(script, /[A-Za-z]+/g));
  if (/[%&/~#*@<>[\]{}|_=+^()]/.test(script)) {
    add('symbols', uniqueMatches(script, /[%&/~#*@<>[\]{}|_=+^()]/g));
  }
  if (/^\s*(#{1,6}\s|[-*•]\s|\d+\.\s)/m.test(script)) add('markdown', '제목·목록 표기');
  if (/\p{Extended_Pictographic}/u.test(script))
    add('emoji', uniqueMatches(script, /\p{Extended_Pictographic}/gu));

  if (opts.displayName) {
    const count = script.split(opts.displayName).length - 1;
    if (count < 1 || count > 3) add('name_count', `이름 ${count}회 (1~3회)`);
  }

  for (const re of GUARANTEE_PATTERNS) {
    const m = script.match(re);
    if (m) add('guarantee_phrase', m[0]);
  }

  for (const item of opts.dislikes ?? []) {
    if (item && script.includes(item)) add('disliked_item', item);
  }

  return { chars, paragraphs, issues };
}
