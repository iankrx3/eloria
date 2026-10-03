import { LIMITS, storyGenerateRequestedSchema } from '@eloria/shared';
import {
  handlePipelineFailure,
  runStoryPipeline,
  type PipelineDeps,
} from '../../pipeline/story-pipeline';
import { inngest } from '../client';

/**
 * story/generate.requested → 스토리 생성(docs/API.md 4절).
 * 사용자당 동시 2개, 전체 동시성은 TTS 플랜 한도 이하(MAX_CONCURRENT_TTS), 단계별 재시도 3회.
 */
export function createGenerateStory(deps: PipelineDeps) {
  return inngest.createFunction(
    {
      id: 'generate-story',
      triggers: [{ event: 'story/generate.requested' }],
      concurrency: [{ key: 'event.data.userId', limit: 2 }, { limit: LIMITS.MAX_CONCURRENT_TTS }],
      retries: 3,
      onFailure: async ({ event, error }) => {
        const original = storyGenerateRequestedSchema.parse(event.data.event.data);
        await handlePipelineFailure(deps.repo, original.storyId, error);
      },
    },
    async ({ event, step }) => {
      const data = storyGenerateRequestedSchema.parse(event.data);
      return runStoryPipeline(deps, data, (id, fn) => step.run(id, fn) as never);
    },
  );
}
