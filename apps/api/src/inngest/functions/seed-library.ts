import { libraryStoryRequestedSchema, librarySeedRequestedSchema } from '@eloria/shared';
import { LIBRARY_CATALOG } from '../../library/catalog';
import { seedLibrary, type LibraryRepo } from '../../library/seed';
import {
  handlePipelineFailure,
  runStoryPipeline,
  type PipelineDeps,
} from '../../pipeline/story-pipeline';
import { inngest } from '../client';

/**
 * library/seed.requested(관리자, 수동) → 카탈로그에서 없는 리추얼 항목을 만들고 한 편씩 생성 이벤트를 보낸다
 * (docs/API.md 4절). 다시 보내도 이미 만든 항목은 건너뛴다.
 */
export function createSeedLibrary(deps: { repo: LibraryRepo }) {
  return inngest.createFunction(
    { id: 'seed-library', triggers: [{ event: 'library/seed.requested' }], retries: 2 },
    async ({ event, step }) => {
      const { categories } = librarySeedRequestedSchema.parse(event.data ?? {});
      const storyIds = await step.run('create-items', () =>
        seedLibrary(deps.repo, LIBRARY_CATALOG, categories),
      );
      if (storyIds.length > 0) {
        await step.sendEvent(
          'request-stories',
          storyIds.map((storyId) => ({ name: 'library/story.requested', data: { storyId } })),
        );
      }
      return { created: storyIds.length };
    },
  );
}

/** library/story.requested → 사용자 스토리와 같은 파이프라인으로 공용 스토리 한 편을 만든다(푸시 없음). */
export function createGenerateLibraryStory(deps: PipelineDeps) {
  return inngest.createFunction(
    {
      id: 'generate-library-story',
      triggers: [{ event: 'library/story.requested' }],
      // 사용자 생성이 TTS 동시성을 다 쓰지 않도록 시드는 2개씩만 돌린다.
      concurrency: [{ limit: 2 }],
      retries: 3,
      onFailure: async ({ event, error }) => {
        const original = libraryStoryRequestedSchema.parse(event.data.event.data);
        await handlePipelineFailure(deps.repo, original.storyId, error);
      },
    },
    async ({ event, step }) => {
      const data = libraryStoryRequestedSchema.parse(event.data);
      return runStoryPipeline(
        { repo: deps.repo, providers: deps.providers },
        data,
        (id, fn) => step.run(id, fn) as never,
      );
    },
  );
}
