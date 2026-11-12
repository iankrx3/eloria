import { pregenerateDailies, type DailyDeps } from '../../daily/daily';
import { inngest } from '../client';

/**
 * 매일 새벽 5시(서울) 최근 활동한 사용자의 오늘 이야기를 미리 만든다(D-48).
 * 무료 쿼터를 지키려고 기본은 꺼 두고, DAILY_PREGEN_ENABLED=1일 때만 돈다.
 * 꺼져 있어도 앱이 홈을 열 때 POST /v1/daily로 그날 이야기를 만든다.
 */
export function createDailyPregen(deps: DailyDeps & { enabled: boolean }) {
  return inngest.createFunction(
    { id: 'daily-pregen', triggers: [{ cron: 'TZ=Asia/Seoul 0 5 * * *' }], retries: 1 },
    async ({ step }) => {
      if (!deps.enabled) return { skipped: true };
      const users = await step.run('pregenerate', () => pregenerateDailies(deps));
      return { users };
    },
  );
}
