/** 초를 "m:ss"로. 음수·NaN은 0으로 본다. */
export function formatTime(seconds: number): string {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function splitParagraphs(script: string): string[] {
  return script
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * 재생 위치에 해당하는 문단 번호. 문단별 낭독 시간을 글자 수에 비례한다고 보고 고른다.
 * 실제 단어 타이밍(ElevenLabs alignment)을 받기 전까지의 근사치다.
 */
export function paragraphAt(paragraphs: readonly string[], currentTime: number, duration: number) {
  if (paragraphs.length === 0 || !(duration > 0)) return 0;
  const target = Math.min(Math.max(currentTime / duration, 0), 1);
  const total = paragraphs.reduce((sum, p) => sum + p.length, 0);
  let acc = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    acc += paragraphs[i]!.length / total;
    if (target < acc) return i;
  }
  return paragraphs.length - 1;
}

/**
 * 지금 문단 안에서 읽은 글자 수(0~길이). 플레이어 자막을 "읽은 만큼 흰색으로 차오르게" 그릴 때 쓴다(Figma H07 노트).
 * paragraphAt과 같은 글자 수 비례 근사다.
 */
export function readCharsInParagraph(
  paragraphs: readonly string[],
  index: number,
  currentTime: number,
  duration: number,
) {
  const p = paragraphs[index];
  if (!p || !(duration > 0)) return 0;
  const total = paragraphs.reduce((sum, x) => sum + x.length, 0);
  const before = paragraphs.slice(0, index).reduce((sum, x) => sum + x.length, 0);
  const target = Math.min(Math.max(currentTime / duration, 0), 1) * total;
  return Math.round(Math.min(Math.max(target - before, 0), p.length));
}
