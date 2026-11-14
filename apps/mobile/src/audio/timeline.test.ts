import {
  formatTime,
  paragraphAt,
  readCharsInParagraph,
  splitParagraphs,
  subtitleLines,
} from './timeline';

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

describe('subtitleLines', () => {
  it('문단을 문장으로 나눈다', () => {
    expect(subtitleLines('나는 창을 연다. 빛이 들어온다.\n\n커피가 따뜻하다.')).toEqual([
      '나는 창을 연다.',
      '빛이 들어온다.',
      '커피가 따뜻하다.',
    ]);
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

describe('readCharsInParagraph', () => {
  const paragraphs = ['aaaa', 'bb', 'cccc'];
  it('지금 문단에서 읽은 글자 수를 0~길이로 돌려준다', () => {
    expect(readCharsInParagraph(paragraphs, 0, 0, 100)).toBe(0);
    expect(readCharsInParagraph(paragraphs, 0, 20, 100)).toBe(2);
    expect(readCharsInParagraph(paragraphs, 1, 50, 100)).toBe(1);
    expect(readCharsInParagraph(paragraphs, 2, 100, 100)).toBe(4);
    expect(readCharsInParagraph(paragraphs, 0, 10, 0)).toBe(0);
  });
});
