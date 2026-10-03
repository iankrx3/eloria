import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './rate-limit';

describe('createRateLimiter', () => {
  it('시간창 안에서는 한도까지만 허용하고, 창이 지나면 다시 허용한다', () => {
    let t = 0;
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000, now: () => t });

    expect([limiter.take('u'), limiter.take('u'), limiter.take('u')]).toEqual([true, true, true]);
    expect(limiter.take('u')).toBe(false);
    expect(limiter.take('other')).toBe(true);

    t = 60_000;
    expect(limiter.take('u')).toBe(true);
  });
});
