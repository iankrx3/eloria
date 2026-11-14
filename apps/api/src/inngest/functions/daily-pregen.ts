import { pregenerateDailies, type DailyDeps } from '../../daily/daily';
import { inngest } from '../client';

/**
 * 서울 05:00에 최근 활동한 사용자의 오늘 이야기를 미리 만든다(D-48).
 * 날짜 키는 사용자 시간대 자정이다(D-50). 그 전에 앱을 연 사용자는 이미 오늘 편이 있다.
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
