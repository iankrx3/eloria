import { login } from '@react-native-seoul/kakao-login';
import { supabase } from '@/lib/supabase';

export type KakaoConnectResult =
  /** 익명 계정에 카카오가 연결됐다. 퀴즈 답변 등 기존 데이터가 그대로 남는다. */
  | { kind: 'linked' }
  /** 이 카카오 계정이 이미 다른 Eloria 계정에 있어 그 계정으로 로그인했다. 익명 데이터는 넘어가지 않는다(Q-07). */
  | { kind: 'switched' }
  /** 익명이 아닌 상태에서 카카오로 로그인했다. */
  | { kind: 'signed-in' };

export class KakaoIdTokenMissingError extends Error {
  constructor() {
    super('카카오 ID 토큰이 없습니다. 카카오 콘솔에서 OpenID Connect를 켜야 합니다.');
    this.name = 'KakaoIdTokenMissingError';
  }
}

/**
 * 카카오 네이티브 SDK로 로그인해 ID 토큰을 받고, 현재 익명 계정에 연결한다(DECISIONS D-08).
 * 사용자가 카카오 로그인을 취소하면 SDK가 던진 에러를 그대로 올린다.
 */
export async function connectKakao(): Promise<KakaoConnectResult> {
  const { idToken } = await login();
  if (!idToken) throw new KakaoIdTokenMissingError();

  const credentials = { provider: 'kakao', token: idToken } as const;
  const { data } = await supabase.auth.getSession();

  if (!data.session?.user.is_anonymous) {
    const { error } = await supabase.auth.signInWithIdToken(credentials);
    if (error) throw error;
    return { kind: 'signed-in' };
  }

  // 카카오 계정에 이메일이 없으면 Supabase가 email_address_invalid로 거부한다(D-23).
  const linked = await supabase.auth.linkIdentity(credentials);
  if (!linked.error) return { kind: 'linked' };
  if (linked.error.code !== 'identity_already_exists') throw linked.error;

  const { error } = await supabase.auth.signInWithIdToken(credentials);
  if (error) throw error;
  return { kind: 'switched' };
}
