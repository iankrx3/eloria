import { describe, expect, it } from 'vitest';
import { canAccessLibraryItem } from './library';

describe('canAccessLibraryItem', () => {
  it('페이월이 꺼져 있으면 모두 연다', () => {
    expect(canAccessLibraryItem({ isFree: false, subscribed: false, paywallEnabled: false })).toBe(
      true,
    );
  });

  it('페이월이 켜지면 무료 항목이나 구독자만', () => {
    const on = { paywallEnabled: true };
    expect(canAccessLibraryItem({ ...on, isFree: true, subscribed: false })).toBe(true);
    expect(canAccessLibraryItem({ ...on, isFree: false, subscribed: true })).toBe(true);
    expect(canAccessLibraryItem({ ...on, isFree: false, subscribed: false })).toBe(false);
  });
});
