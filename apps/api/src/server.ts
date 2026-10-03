import { serve } from '@hono/node-server';
import { createApp } from './app';
import { loadEnv } from './env';
import { createAdminClient } from './lib/supabase-admin';
import { createSupabaseVerifier } from './middleware/auth';
import { createSupabaseQuizRepo } from './repos/quiz-repo';

const env = loadEnv();
const db = createAdminClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const app = createApp({
  quizRepo: createSupabaseQuizRepo(db),
  verifyToken: createSupabaseVerifier({
    supabaseUrl: env.SUPABASE_URL,
    jwtSecret: env.SUPABASE_JWT_SECRET,
  }),
});

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`[api] http://localhost:${info.port} (provider: ${env.PROVIDER_MODE})`);
});
