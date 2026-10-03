import { formatTime, paragraphAt, splitParagraphs } from './timeline';

describe('formatTime', () => {
  it('m:ss로 바꾸고 잘못된 값은 0:00', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65.9)).toBe('1:05');
    expect(formatTime(-3)).toBe('0:00');
    expect(formatTime(Number.NaN)).toBe('0:00');
  });
});

describe('splitParagraphs', () => {
  it('빈 줄로 나누고 빈 문단은 버린다', () => {
    expect(splitParagraphs('가\n\n나\n \n\n다')).toEqual(['가', '나', '다']);
  });
});

describe('paragraphAt', () => {
  const paragraphs = ['aaaa', 'bb', 'cccc']; // 글자 비율 0.4 / 0.2 / 0.4

  it('재생 위치 비율을 문단 글자 수 비율에 맞춘다', () => {
    expect(paragraphAt(paragraphs, 0, 100)).toBe(0);
    expect(paragraphAt(paragraphs, 39, 100)).toBe(0);
    expect(paragraphAt(paragraphs, 45, 100)).toBe(1);
    expect(paragraphAt(paragraphs, 61, 100)).toBe(2);
    expect(paragraphAt(paragraphs, 100, 100)).toBe(2);
  });

  it('길이를 모르면 첫 문단', () => {
    expect(paragraphAt(paragraphs, 10, 0)).toBe(0);
    expect(paragraphAt([], 10, 100)).toBe(0);
  });
});
