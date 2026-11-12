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
import { createGeminiBudget } from './lib/gemini-budget';
import { createAdminClient } from './lib/supabase-admin';
import { createSupabaseVerifier } from './middleware/auth';
import { createStoryNotifier } from './notifications/story-notifier';
import { createSupabaseLibraryRepo } from './repos/library-repo';
import { createSupabasePipelineRepo } from './repos/pipeline-repo';
import { createSupabasePushRepo } from './repos/push-repo';
import { createSupabaseQuizRepo } from './repos/quiz-repo';
import { createSupabaseStoryRepo } from './repos/story-repo';
import { createSupabaseAccountRepo } from './repos/account-repo';
import { createSupabaseAffirmationRepo } from './repos/affirmation-repo';

const env = loadEnv();
const db = createAdminClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const providers = createProviders(process.env, {
  budget: createGeminiBudget(db, env.GEMINI_DAILY_CALL_LIMIT),
});
const pushRepo = createSupabasePushRepo(db);
const pipelineRepo = createSupabasePipelineRepo(db);
const affirmationRepo = createSupabaseAffirmationRepo(db);
const notifier = createStoryNotifier({
  repo: pushRepo,
  client: createExpoPushClient({ accessToken: env.EXPO_ACCESS_TOKEN }),
});
const app = createApp({
  quizRepo: createSupabaseQuizRepo(db),
  storyRepo: createSupabaseStoryRepo(db),
  accountRepo: createSupabaseAccountRepo(db),
  affirmations: { repo: affirmationRepo, providers },
  profile: { repo: affirmationRepo, providers },
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
  console.log(
    `[api] http://localhost:${info.port} (gemini: ${env.GEMINI_MODE ?? env.PROVIDER_MODE}, tts: ${env.TTS_MODE ?? env.PROVIDER_MODE}, gemini 하루 상한 ${env.GEMINI_DAILY_CALL_LIMIT})`,
  );
});
