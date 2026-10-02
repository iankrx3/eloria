import { createMiddleware } from 'hono/factory';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { ApiError } from '../lib/errors';

export type AuthUser = { id: string; isAnonymous: boolean };
export type AuthVariables = { user: AuthUser };

/** 토큰을 검증하고 payload를 돌려준다. 실패하면 throw한다. */
export type TokenVerifier = (token: string) => Promise<JWTPayload>;

/**
 * Supabase access token 검증기. 비대칭 서명 키 프로젝트는 JWKS로,
 * 레거시 HS256 프로젝트는 SUPABASE_JWT_SECRET으로 검증한다.
 */
export function createSupabaseVerifier(opts: {
  supabaseUrl: string;
  jwtSecret?: string;
}): TokenVerifier {
  const issuer = `${opts.supabaseUrl.replace(/\/$/, '')}/auth/v1`;
  const verifyOptions = { issuer, audience: 'authenticated' };

  if (opts.jwtSecret) {
    const secret = new TextEncoder().encode(opts.jwtSecret);
    return async (token) => (await jwtVerify(token, secret, verifyOptions)).payload;
  }
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  return async (token) => (await jwtVerify(token, jwks, verifyOptions)).payload;
}

/** userId는 검증된 토큰의 sub에서만 얻는다(API.md 1절). */
export function requireAuth(verify: TokenVerifier) {
  return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const header = c.req.header('Authorization');
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : undefined;
    if (!token) throw new ApiError('UNAUTHORIZED', '로그인이 필요합니다.');

    let payload: JWTPayload;
    try {
      payload = await verify(token);
    } catch {
      throw new ApiError('UNAUTHORIZED', '세션이 만료되었습니다. 다시 로그인해 주세요.');
    }
    if (!payload.sub) throw new ApiError('UNAUTHORIZED', '로그인이 필요합니다.');

    c.set('user', { id: payload.sub, isAnonymous: payload.is_anonymous === true });
    await next();
  });
}
