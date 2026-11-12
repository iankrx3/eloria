import { Hono } from 'hono';
import type { AuthVariables } from '../middleware/auth';
import { suggestLifestyle, type LifestyleDeps } from '../profile/lifestyle';

/** 프로필 보조 기능(docs/API.md). 프로필 값 자체는 앱이 RLS로 직접 고친다. */
export function createProfileRoutes(deps: LifestyleDeps) {
  return new Hono<{ Variables: AuthVariables }>().post('/lifestyle-suggestions', async (c) =>
    c.json(await suggestLifestyle(deps, c.get('user').id)),
  );
}
