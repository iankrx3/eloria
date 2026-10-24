/**
 * 프롬프트 평가 세트 실행(docs/AI_PIPELINE.md 5절). 실제 API 비용이 든다(음성은 만들지 않음).
 *
 *   pnpm eval:story                         GEMINI_STORY_MODEL 하나로 30개
 *   pnpm eval:story --models a,b,c          모델 여러 개를 블라인드 비교(A·B·C로 섞어 저장)
 *   pnpm eval:story --only love-06,health-06 일부 케이스만
 *   pnpm eval:story --mock                  외부 호출 없이 실행기만 확인(결과는 mock 글)
 *
 * 결과: packages/prompts/eval/out/<날짜-시각>/ (gitignore). 위험 입력이 새어 나가면 종료 코드 1.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { parseEvalCases, REASON_LABEL, type EvalCase } from '@eloria/prompts';
import { createProviders, type StoryModel } from '@eloria/providers';
import { LIMITS, type SafetyVerdict } from '@eloria/shared';
import { judgeEvalResult, runEvalCase, type EvalResult } from '../eval/run-eval';

const ROOT = resolve(import.meta.dirname, '../../../..');
const EVAL_DIR = join(ROOT, 'packages/prompts/eval');

const { values: args } = parseArgs({
  options: {
    mock: { type: 'boolean', default: false },
    models: { type: 'string' },
    only: { type: 'string' },
  },
});

const split = (v: string | undefined) =>
  v
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

const allCases = parseEvalCases(readFileSync(join(EVAL_DIR, 'dreams.jsonl'), 'utf8'));
const only = split(args.only);
const cases = only.length ? allCases.filter((c) => only.includes(c.id)) : allCases;
if (cases.length === 0) throw new Error(`--only에 맞는 케이스가 없습니다: ${args.only}`);

const models = args.mock ? ['mock'] : split(args.models);
if (!args.mock && models.length === 0) {
  const fromEnv = process.env.GEMINI_STORY_MODEL;
  if (!fromEnv)
    throw new Error('GEMINI_STORY_MODEL을 apps/api/.env에 넣거나 --models로 지정하세요.');
  models.push(fromEnv);
}

function storyModelFor(model: string): StoryModel {
  const env = args.mock
    ? { ...process.env, PROVIDER_MODE: 'mock' }
    : { ...process.env, PROVIDER_MODE: 'live', GEMINI_STORY_MODEL: model };
  try {
    return createProviders(env).story;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    console.error('실행기만 확인하려면 --mock을 붙이세요.');
    process.exit(1);
  }
}

/** 모델 이름을 숨기고 A·B·C로 섞는다. 채점이 끝난 뒤 key.json으로 맞춰 본다. */
const labels = models
  .map((model) => ({ model, sort: Math.random() }))
  .sort((a, b) => a.sort - b.sort)
  .map(({ model }, i) => ({ label: String.fromCharCode(65 + i), model }));

const limits = { targetChars: LIMITS.STORY_TARGET_CHARS, maxChars: LIMITS.STORY_MAX_CHARS };
const results = new Map<string, EvalResult[]>(); // label → 케이스 순서대로

for (const { label, model } of labels) {
  const story = storyModelFor(model);
  const list: EvalResult[] = [];
  for (const c of cases) {
    process.stdout.write(`[${label}] ${c.id} … `);
    const r = await runEvalCase(story, c, limits);
    list.push(r);
    console.log(
      `${r.outcome}${r.blockedAt ? `(${r.blockedAt})` : ''} ${(r.ms / 1000).toFixed(1)}s`,
    );
  }
  results.set(label, list);
}

// ---- 저장 ----
const pad = (n: number) => String(n).padStart(2, '0');
const now = new Date();
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
const outDir = join(EVAL_DIR, 'out', `${stamp}${args.mock ? '-mock' : ''}`);
mkdirSync(join(outDir, 'cases'), { recursive: true });

const verdictText = (v: SafetyVerdict | undefined) =>
  v
    ? `${v.verdict}${v.reasons.length ? ` (${v.reasons.map((r) => REASON_LABEL[r]).join(', ')})` : ''}`
    : '-';

function caseMarkdown(c: EvalCase): string {
  const lines = [
    `# ${c.id}`,
    '',
    `- 꿈: ${c.dream}`,
    `- 이름: ${c.context.displayName ?? '없음'} · 톤: ${c.context.tone} · 사람: ${c.context.people.map((p) => p.name).join(', ') || '없음'}`,
    `- 좋아하는 것: ${c.context.likes?.join(', ') ?? '없음'} · 피할 것: ${c.context.dislikes?.join(', ') ?? '없음'}`,
  ];
  for (const { label } of labels) {
    const r = results.get(label)!.find((x) => x.caseId === c.id)!;
    lines.push('', '---', '', `## 버전 ${label}`, '');
    if (r.outcome === 'error') {
      lines.push(`오류: ${r.error}`);
      continue;
    }
    lines.push(
      `- 입력 검수: ${verdictText(r.inputVerdict)} · 스크립트 검수: ${verdictText(r.scriptVerdict)}${r.rewritten ? ' · 재작성 1회' : ''}`,
    );
    if (r.outcome === 'blocked') {
      const v = r.blockedAt === 'input' ? r.inputVerdict : r.scriptVerdict;
      lines.push(`- 차단됨(${r.blockedAt === 'input' ? '입력' : '스크립트'}): ${v?.notes ?? ''}`);
    }
    if (r.plan)
      lines.push(
        `- 제목: ${r.plan.title} · 장소: ${r.plan.setting.place} · ${r.plan.setting.timeOfDay}`,
      );
    if (r.check) {
      const issues = r.check.issues.map((i) => `${i.code}(${i.detail})`).join(', ');
      lines.push(
        `- ${r.check.chars}자 · ${r.check.paragraphs}문단 · 점검: ${issues || '문제 없음'}`,
      );
    }
    if (r.script) lines.push('', r.script);
  }
  return lines.join('\n') + '\n';
}

for (const c of cases) writeFileSync(join(outDir, 'cases', `${c.id}.md`), caseMarkdown(c));

writeFileSync(
  join(outDir, 'key.json'),
  JSON.stringify(Object.fromEntries(labels.map((l) => [l.label, l.model])), null, 2),
);
writeFileSync(join(outDir, 'results.json'), JSON.stringify(Object.fromEntries(results), null, 2));

// 엑셀에서 한글이 깨지지 않게 BOM을 붙인다.
const csv = ['case_id,label,immersion,personalization,korean,readability,notes'];
for (const c of cases) {
  for (const { label } of labels) {
    if (results.get(label)!.find((x) => x.caseId === c.id)?.outcome === 'story')
      csv.push(`${c.id},${label},,,,,`);
  }
}
writeFileSync(join(outDir, 'scores.csv'), '﻿' + csv.join('\r\n') + '\r\n');

writeFileSync(
  join(outDir, 'README.md'),
  `# 평가 ${stamp}${args.mock ? ' (mock)' : ''}

1. \`cases/\`의 파일을 읽고 \`scores.csv\`에 버전별로 1~5점을 적는다. key.json은 채점이 끝난 뒤에 연다.
   - immersion: 몰입감 · personalization: 개인화 · korean: 자연스러운 한국어 · readability: 낭독 적합성
2. 버전마다 낭독 표기(숫자·영문), 길이, 이름 횟수 점검 결과가 함께 적혀 있다.
3. results.json은 원본 결과(장면 계획 포함)다.
`,
);

// ---- 요약 ----
let safetyFailures = 0;
console.log(`\n결과: ${outDir}`);
for (const { label } of labels) {
  const list = results.get(label)!;
  const count = (o: EvalResult['outcome']) => list.filter((r) => r.outcome === o).length;
  const stories = list.filter((r) => r.check);
  const avgChars = stories.length
    ? Math.round(stories.reduce((s, r) => s + r.check!.chars, 0) / stories.length)
    : 0;
  const cost = list.reduce((s, r) => s + r.costUsd, 0);
  console.log(
    `\n[${label}] 스토리 ${count('story')} · 차단 ${count('blocked')} · 오류 ${count('error')} · 평균 ${avgChars}자 · 추정 $${cost.toFixed(3)}`,
  );
  for (const c of cases) {
    const { safety, warnings } = judgeEvalResult(
      c,
      list.find((r) => r.caseId === c.id)!,
    );
    safetyFailures += safety.length;
    for (const s of safety) console.log(`  ✗ ${c.id}: ${s}`);
    for (const w of warnings) console.log(`  ! ${c.id}: ${w}`);
  }
}

if (safetyFailures > 0) {
  if (args.mock) {
    console.log(
      `\n안전 실패 ${safetyFailures}건(mock 작가는 꿈을 그대로 옮겨 적어서 생기는 실패, 종료 코드는 0)`,
    );
  } else {
    console.log(`\n안전 실패 ${safetyFailures}건. 프롬프트를 고치고 다시 돌리세요.`);
    process.exit(1);
  }
}
