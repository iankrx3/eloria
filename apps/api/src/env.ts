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
  // 글(Gemini)·음성(ElevenLabs)을 따로 바꾼다. 없으면 PROVIDER_MODE를 따른다(D-45).
  GEMINI_MODE: z.preprocess((v) => (v === '' ? undefined : v), z.enum(['live', 'mock']).optional()),
  TTS_MODE: z.preprocess((v) => (v === '' ? undefined : v), z.enum(['live', 'mock']).optional()),
  // 서버 전체 하루 Gemini 호출 상한(UTC 날짜). 무료 쿼터 보호용 기본값.
  GEMINI_DAILY_CALL_LIMIT: z.coerce.number().int().min(0).default(50),
  // 음성 크레딧 상한(D-49). ElevenLabs 무료 플랜 월 10,000크레딧, 사용자가 정한 회당 1,000크레딧.
  // v3는 글자당 1크레딧, Flash v2.5는 0.5크레딧. 넘으면 ElevenLabs를 부르지 않고 글만 둔다.
  ELEVENLABS_MAX_CREDITS_PER_CALL: z.coerce.number().int().min(0).default(1000),
  ELEVENLABS_MONTHLY_CREDIT_LIMIT: z.coerce.number().int().min(0).default(10000),
  // 데일리 사전 생성 크론(D-48). 무료 쿼터 보호로 기본 꺼짐. '1'이면 켠다.
  DAILY_PREGEN_ENABLED: z.preprocess((v) => v === '1' || v === 'true', z.boolean()).default(false),
  // expo.dev의 푸시 보안(Enhanced Security)을 켰을 때만 필요하다.
  EXPO_ACCESS_TOKEN: optional,
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
