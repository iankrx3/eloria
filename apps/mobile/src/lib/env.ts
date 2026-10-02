import { z } from 'zod';

/**
 * 앱 번들에 들어가는 공개 값만 둔다(EXPO_PUBLIC_*). 비밀키는 절대 여기에 넣지 않는다.
 * Expo는 `process.env.EXPO_PUBLIC_X`처럼 정적으로 접근한 값만 인라인하므로 하나씩 적는다.
 */
const schema = z.object({
  supabaseUrl: z.url(),
  supabaseAnonKey: z.string().min(1),
  apiUrl: z.url(),
});

const parsed = schema.safeParse({
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
});

if (!parsed.success) {
  const fields = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
  throw new Error(`apps/mobile/.env의 EXPO_PUBLIC_ 값을 확인하세요: ${fields}`);
}

export const env = parsed.data;
