import { describe, expect, it } from 'vitest';
import { toCamel, toSnake } from './case';

describe('toCamel / toSnake', () => {
  it('중첩 객체와 배열의 키를 변환한다', () => {
    const row = {
      display_name: '서아',
      name_pronunciation: null,
      likes: ['커피'],
      meta: { last_active_at: 1 },
    };
    const camel = toCamel(row);
    expect(camel).toEqual({
      displayName: '서아',
      namePronunciation: null,
      likes: ['커피'],
      meta: { lastActiveAt: 1 },
    });
    expect(toSnake(camel)).toEqual(row);
  });

  it('Date 같은 객체는 그대로 둔다', () => {
    const at = new Date(0);
    expect(toCamel({ granted_at: at }).grantedAt).toBe(at);
  });
});
