import { serve } from '@hono/node-server';
import { createApp } from './app';
import { loadEnv } from './env';
import { createSupabaseVerifier } from './middleware/auth';

const env = loadEnv();
const app = createApp({
  verifyToken: createSupabaseVerifier({
    supabaseUrl: env.SUPABASE_URL,
    jwtSecret: env.SUPABASE_JWT_SECRET,
  }),
});

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`[api] http://localhost:${info.port} (provider: ${env.PROVIDER_MODE})`);
});
