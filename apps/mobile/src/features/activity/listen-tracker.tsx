import { ACTIVITY_RULE } from '@eloria/shared';
import { useEffect, useRef } from 'react';
import { usePlayer } from '@/audio/player-provider';
import { usePlayerStore } from '@/audio/player-store';
import { useRecordActivity } from './use-activity';

/**
 * 재생 중인 이야기를 90% 이상 들으면 오늘 활동에 "이야기 1개"를 더한다(Figma H11 기록 규칙).
 * 같은 트랙은 앱을 켠 동안 한 번만 센다. 탭 레이아웃에 한 번 붙인다.
 */
export function ListenTracker() {
  const { status } = usePlayer();
  const storyId = usePlayerStore((s) => s.track?.storyId);
  const record = useRecordActivity();
  const counted = useRef(new Set<string>());

  const ratio = status.duration > 0 ? status.currentTime / status.duration : 0;
  const reached = ratio >= ACTIVITY_RULE.LISTENED_RATIO || status.didJustFinish === true;

  useEffect(() => {
    if (!storyId || !reached || counted.current.has(storyId)) return;
    counted.current.add(storyId);
    record.mutate({ stories: 1 }, { onError: () => counted.current.delete(storyId) });
    // record는 매 렌더 새 객체라 의존성에서 뺀다(mutate만 쓴다).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, reached]);

  return null;
}
