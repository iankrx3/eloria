import { serve } from '@hono/node-server';
import { createApp } from './app';
import { inngestStoryEvents } from './inngest/events';
import { loadEnv } from './env';
import { createAdminClient } from './lib/supabase-admin';
import { createSupabaseVerifier } from './middleware/auth';
import { createSupabaseQuizRepo } from './repos/quiz-repo';
import { createSupabaseStoryRepo } from './repos/story-repo';

const env = loadEnv();
const db = createAdminClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const app = createApp({
  quizRepo: createSupabaseQuizRepo(db),
  storyRepo: createSupabaseStoryRepo(db),
  storyEvents: inngestStoryEvents,
  verifyToken: createSupabaseVerifier({
    supabaseUrl: env.SUPABASE_URL,
    jwtSecret: env.SUPABASE_JWT_SECRET,
  }),
});

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`[api] http://localhost:${info.port} (provider: ${env.PROVIDER_MODE})`);
});
