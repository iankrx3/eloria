/**
 * 사용자별 고정 시간창 요청 제한(ARCHITECTURE 6절: 생성 요청 분당 3회).
 * 프로세스 메모리에 두므로 서버 인스턴스가 여러 개면 인스턴스마다 따로 센다(D-26).
 * 비용 한도는 이것이 아니라 generation_quota로 판단한다.
 */
export type RateLimiter = { take(key: string): boolean };

export function createRateLimiter(opts: {
  limit: number;
  windowMs: number;
  now?: () => number;
}): RateLimiter {
  const now = opts.now ?? Date.now;
  const hits = new Map<string, number[]>();

  return {
    take(key) {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((at) => t - at < opts.windowMs);
      if (recent.length >= opts.limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(t);
      hits.set(key, recent);
      return true;
    },
  };
}
