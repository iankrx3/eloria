import { Inngest } from 'inngest';

// 로컬에서는 INNGEST_DEV=1로 dev server(`pnpm dev:inngest`)에 연결한다.
export const inngest = new Inngest({ id: 'eloria' });
