import { pushTokenRequestSchema } from '@eloria/shared';
import { Hono } from 'hono';
import type { AuthVariables } from '../middleware/auth';
import type { PushRepo } from '../repos/push-repo';

/** 푸시 토큰 등록(docs/API.md 2절). 앱은 권한이 있을 때 실행마다 보내도 된다(멱등). */
export function createPushTokenRoutes(repo: PushRepo) {
  return new Hono<{ Variables: AuthVariables }>().post('/', async (c) => {
    const body = pushTokenRequestSchema.parse(await c.req.json());
    await repo.upsertToken(c.get('user').id, body);
    return c.body(null, 204);
  });
}
