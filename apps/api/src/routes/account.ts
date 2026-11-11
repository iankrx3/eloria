import { accountDeleteRequestSchema } from '@eloria/shared';
import { Hono } from 'hono';
import type { AuthVariables } from '../middleware/auth';
import type { AccountRepo } from '../repos/account-repo';

/** 계정 작업(docs/API.md). userId는 검증된 토큰에서만 얻는다. */
export function createAccountRoutes(repo: AccountRepo) {
  return new Hono<{ Variables: AuthVariables }>().post('/delete', async (c) => {
    const body = accountDeleteRequestSchema.parse(await c.req.json().catch(() => ({})));
    await repo.deleteAccount(c.get('user').id, body.reasons);
    return c.body(null, 204);
  });
}
