import { progressState } from './progress-state';

describe('progressState', () => {
  it('생성 중에는 단계 문구를 보여 주고, 텍스트가 오면 먼저 읽기를 연다', () => {
    expect(progressState('planning', null)).toEqual({
      kind: 'working',
      message: 'planning',
      canReadFirst: false,
    });
    expect(progressState('text_ready', null)).toEqual({
      kind: 'working',
      message: 'voicing',
      canReadFirst: true,
    });
  });

  it('음성이 준비되면 완료', () => {
    expect(progressState('audio_ready', null)).toEqual({ kind: 'done' });
    expect(progressState('ready', null)).toEqual({ kind: 'done' });
  });

  it('위기 신호는 도움 안내, 일반 차단은 다시 적기 안내', () => {
    expect(progressState('failed', 'SAFETY_CRISIS')).toEqual({ kind: 'crisis' });
    expect(progressState('failed', 'SAFETY_BLOCKED')).toEqual({ kind: 'blocked' });
  });

  it('음성만 실패하면 읽기는 열어 둔다', () => {
    expect(progressState('text_ready', 'TTS_FAILED')).toEqual({ kind: 'failed', canRead: true });
    expect(progressState('failed', 'GENERATION_FAILED')).toEqual({ kind: 'failed', canRead: false });
  });
});
