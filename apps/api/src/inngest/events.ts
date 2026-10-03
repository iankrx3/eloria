import { storyGenerateRequestedSchema, type StoryGenerateRequested } from '@eloria/shared';
import { inngest } from './client';

/** API가 작업 큐에 보내는 이벤트. 테스트에서는 가짜로 바꿔 끼운다. */
export interface StoryEvents {
  requestGeneration(data: StoryGenerateRequested): Promise<void>;
}

export const inngestStoryEvents: StoryEvents = {
  async requestGeneration(data) {
    await inngest.send({
      name: 'story/generate.requested',
      data: storyGenerateRequestedSchema.parse(data),
    });
  },
};
