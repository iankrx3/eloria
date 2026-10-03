import { serve } from '@hono/node-server';
import { createApp } from './app';
import { createProviders } from '@eloria/providers';
import { createGenerateStory, ping } from './inngest';
import { inngestStoryEvents } from './inngest/events';
import { loadEnv } from './env';
import { createAdminClient } from './lib/supabase-admin';
import { createSupabaseVerifier } from './middleware/auth';
import { createSupabasePipelineRepo } from './repos/pipeline-repo';
import { createSupabaseQuizRepo } from './repos/quiz-repo';
import { createSupabaseStoryRepo } from './repos/story-repo';

const env = loadEnv();
const db = createAdminClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const providers = createProviders(process.env);
const app = createApp({
  quizRepo: createSupabaseQuizRepo(db),
  storyRepo: createSupabaseStoryRepo(db),
  storyEvents: inngestStoryEvents,
  inngestFunctions: [
    ping,
    createGenerateStory({ repo: createSupabasePipelineRepo(db), providers }),
  ],
  verifyToken: createSupabaseVerifier({
    supabaseUrl: env.SUPABASE_URL,
    jwtSecret: env.SUPABASE_JWT_SECRET,
  }),
});

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`[api] http://localhost:${info.port} (provider: ${env.PROVIDER_MODE})`);
});
