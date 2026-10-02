import { z } from 'zod';

/** 빈 문자열(`KEY=`)은 값이 없는 것으로 본다. */
const optional = z.preprocess((v) => (v === '' ? undefined : v), z.string().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8787),
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // 레거시 HS256 프로젝트에서만 쓴다. 비어 있으면 JWKS로 검증한다(docs/SETUP.md 3절).
  SUPABASE_JWT_SECRET: optional,
  PROVIDER_MODE: z.enum(['live', 'mock']).default('live'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`apps/api 환경 변수가 올바르지 않습니다: ${fields} (apps/api/.env 확인)`);
  }
  return parsed.data;
}
