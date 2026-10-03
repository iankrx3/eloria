import { describe, expect, it } from 'vitest';
import { addPersonalItem, PERSONAL_LIST_MAX, personalProfileSchema } from './profile';

describe('personalProfileSchema', () => {
  const base = { displayName: '서아', tone: 'calm', likes: ['커피'], dislikes: [] };

  it('이름은 1~20자, 톤은 정해진 값만', () => {
    expect(personalProfileSchema.safeParse(base).success).toBe(true);
    expect(personalProfileSchema.safeParse({ ...base, displayName: '  ' }).success).toBe(false);
    expect(personalProfileSchema.safeParse({ ...base, tone: 'loud' }).success).toBe(false);
  });

  it('목록은 중복·한도 초과를 거부한다', () => {
    expect(personalProfileSchema.safeParse({ ...base, likes: ['a', 'a'] }).success).toBe(false);
    const many = Array.from({ length: PERSONAL_LIST_MAX + 1 }, (_, i) => `x${i}`);
    expect(personalProfileSchema.safeParse({ ...base, dislikes: many }).success).toBe(false);
  });
});

describe('addPersonalItem', () => {
  it('공백을 다듬어 더하고, 빈 값·중복·한도 초과는 무시한다', () => {
    expect(addPersonalItem(['커피'], '  산책 ')).toEqual(['커피', '산책']);
    expect(addPersonalItem(['커피'], '   ')).toEqual(['커피']);
    expect(addPersonalItem(['커피'], '커피')).toEqual(['커피']);
    const full = Array.from({ length: PERSONAL_LIST_MAX }, (_, i) => `x${i}`);
    expect(addPersonalItem(full, '새것')).toHaveLength(PERSONAL_LIST_MAX);
  });
});
