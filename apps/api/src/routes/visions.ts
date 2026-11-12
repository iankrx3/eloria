import { visionsRequestSchema } from '@eloria/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthVariables } from '../middleware/auth';
import { createVisions, startVisionStory, type VisionDeps } from '../visions/visions';

const pickParamsSchema = z.object({
  desireId: z.uuid(),
  position: z.coerce.number().int().min(1).max(4),
});

/** 비전 고르기(docs/API.md, Figma H05) */
export function createVisionRoutes(deps: VisionDeps) {
  return new Hono<{ Variables: AuthVariables }>()
    .post('/', async (c) => {
      const body = visionsRequestSchema.parse(await c.req.json());
      return c.json(await createVisions(deps, c.get('user').id, body));
    })
    .post('/:desireId/:position/story', async (c) => {
      const { desireId, position } = pickParamsSchema.parse(c.req.param());
      return c.json(await startVisionStory(deps, c.get('user').id, desireId, position), 202);
    });
}
