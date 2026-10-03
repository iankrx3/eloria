import { canReadStory, type StoryStatus } from '@eloria/shared';

export type ProgressState =
  | { kind: 'working'; message: ProgressMessage; canReadFirst: boolean }
  | { kind: 'done' }
  | { kind: 'crisis' }
  | { kind: 'blocked' }
  | { kind: 'failed'; canRead: boolean };

export type ProgressMessage = 'queued' | 'planning' | 'writing' | 'reviewing' | 'voicing';

/** 스토리 상태 → 생성 진행 화면의 상태(DESIGN 4절: 단계 문구 교체, 텍스트 도착 시 "먼저 읽어보기"). */
export function progressState(status: StoryStatus, errorCode: string | null): ProgressState {
  switch (status) {
    case 'queued':
    case 'planning':
    case 'writing':
    case 'reviewing':
      return { kind: 'working', message: status, canReadFirst: false };
    case 'text_ready':
      // 음성만 실패한 경우(TTS_FAILED)에도 읽기는 열어 둔다(AI_PIPELINE 2절).
      return errorCode
        ? { kind: 'failed', canRead: true }
        : { kind: 'working', message: 'voicing', canReadFirst: true };
    case 'audio_ready':
    case 'ready':
      return { kind: 'done' };
    case 'failed':
      if (errorCode === 'SAFETY_CRISIS') return { kind: 'crisis' };
      if (errorCode === 'SAFETY_BLOCKED') return { kind: 'blocked' };
      return { kind: 'failed', canRead: canReadStory(status) };
  }
}
