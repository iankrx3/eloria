import { serve } from '@hono/node-server';
import { createApp } from './app';
import { createExpoPushClient, createProviders } from '@eloria/providers';
import {
  createGenerateLibraryStory,
  createGenerateStory,
  createSeedLibrary,
  ping,
} from './inngest';
import { inngestStoryEvents } from './inngest/events';
import { loadEnv } from './env';
import { createAdminClient } from './lib/supabase-admin';
import { createSupabaseVerifier } from './middleware/auth';
import { createStoryNotifier } from './notifications/story-notifier';
import { createSupabaseLibraryRepo } from './repos/library-repo';
import { createSupabasePipelineRepo } from './repos/pipeline-repo';
import { createSupabasePushRepo } from './repos/push-repo';
import { createSupabaseQuizRepo } from './repos/quiz-repo';
import { createSupabaseStoryRepo } from './repos/story-repo';

const env = loadEnv();
const db = createAdminClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const providers = createProviders(process.env);
const pushRepo = createSupabasePushRepo(db);
const pipelineRepo = createSupabasePipelineRepo(db);
const notifier = createStoryNotifier({
  repo: pushRepo,
  client: createExpoPushClient({ accessToken: env.EXPO_ACCESS_TOKEN }),
});
const app = createApp({
  quizRepo: createSupabaseQuizRepo(db),
  storyRepo: createSupabaseStoryRepo(db),
  pushRepo,
  storyEvents: inngestStoryEvents,
  inngestFunctions: [
    ping,
    createGenerateStory({ repo: pipelineRepo, providers, notifier }),
    createSeedLibrary({ repo: createSupabaseLibraryRepo(db) }),
    createGenerateLibraryStory({ repo: pipelineRepo, providers }),
  ],
  verifyToken: createSupabaseVerifier({
    supabaseUrl: env.SUPABASE_URL,
    jwtSecret: env.SUPABASE_JWT_SECRET,
  }),
});

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`[api] http://localhost:${info.port} (provider: ${env.PROVIDER_MODE})`);
});
