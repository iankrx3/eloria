import { login } from '@react-native-seoul/kakao-login';
import { supabase } from '@/lib/supabase';
import { connectKakao, KakaoIdTokenMissingError } from './kakao';

jest.mock('@react-native-seoul/kakao-login', () => ({ login: jest.fn() }));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: jest.fn(), linkIdentity: jest.fn(), signInWithIdToken: jest.fn() },
  },
}));

const auth = supabase.auth as unknown as Record<
  'getSession' | 'linkIdentity' | 'signInWithIdToken',
  jest.Mock
>;
const kakaoLogin = login as unknown as jest.Mock;

function session(isAnonymous: boolean) {
  return { data: { session: { user: { is_anonymous: isAnonymous } } } };
}

beforeEach(() => {
  jest.resetAllMocks();
  kakaoLogin.mockResolvedValue({ idToken: 'kakao-id-token' });
});

describe('connectKakao', () => {
  it('익명 사용자면 카카오 ID 토큰을 현재 계정에 연결한다', async () => {
    auth.getSession.mockResolvedValue(session(true));
    auth.linkIdentity.mockResolvedValue({ data: {}, error: null });

    await expect(connectKakao()).resolves.toEqual({ kind: 'linked' });
    expect(auth.linkIdentity).toHaveBeenCalledWith({ provider: 'kakao', token: 'kakao-id-token' });
    expect(auth.signInWithIdToken).not.toHaveBeenCalled();
  });

  it('이미 다른 계정에 연결된 카카오면 그 계정으로 로그인한다', async () => {
    auth.getSession.mockResolvedValue(session(true));
    auth.linkIdentity.mockResolvedValue({ data: null, error: { code: 'identity_already_exists' } });
    auth.signInWithIdToken.mockResolvedValue({ data: {}, error: null });

    await expect(connectKakao()).resolves.toEqual({ kind: 'switched' });
    expect(auth.signInWithIdToken).toHaveBeenCalledWith({
      provider: 'kakao',
      token: 'kakao-id-token',
    });
  });

  it('그 밖의 연결 오류는 그대로 던진다', async () => {
    const error = { code: 'unexpected_audience' };
    auth.getSession.mockResolvedValue(session(true));
    auth.linkIdentity.mockResolvedValue({ data: null, error });

    await expect(connectKakao()).rejects.toBe(error);
    expect(auth.signInWithIdToken).not.toHaveBeenCalled();
  });

  it('익명이 아니면 카카오로 로그인한다', async () => {
    auth.getSession.mockResolvedValue(session(false));
    auth.signInWithIdToken.mockResolvedValue({ data: {}, error: null });

    await expect(connectKakao()).resolves.toEqual({ kind: 'signed-in' });
    expect(auth.linkIdentity).not.toHaveBeenCalled();
  });

  it('ID 토큰이 없으면(OIDC 꺼짐) 원인을 알려 준다', async () => {
    kakaoLogin.mockResolvedValue({ idToken: '' });
    await expect(connectKakao()).rejects.toBeInstanceOf(KakaoIdTokenMissingError);
  });
});
