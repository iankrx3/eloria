import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

type AuthState =
  | { status: 'loading'; session: null }
  | { status: 'signed-in'; session: Session }
  | { status: 'error'; session: null; error: Error };

const AuthContext = createContext<AuthState>({ status: 'loading', session: null });

/**
 * 저장된 세션이 없으면 익명으로 로그인한다. 퀴즈는 익명 세션으로 시작하고
 * 페이월 직전에 소셜 계정을 연결한다(DECISIONS D-08).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', session: null });

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const { data } = await supabase.auth.getSession();
      if (data.session) return;
      const { error } = await supabase.auth.signInAnonymously();
      if (error && !cancelled) setState({ status: 'error', session: null, error });
    }

    // 카카오 연결(linkIdentity) 뒤에는 USER_UPDATED/SIGNED_IN으로 새 세션이 온다.
    // 로그아웃되면 다시 익명 세션을 만든다.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (session) {
        setState({ status: 'signed-in', session });
      } else if (event === 'SIGNED_OUT') {
        setState({ status: 'loading', session: null });
        void supabase.auth.signInAnonymously();
      }
    });

    bootstrap().catch((e: unknown) => {
      if (!cancelled) {
        setState({
          status: 'error',
          session: null,
          error: e instanceof Error ? e : new Error(String(e)),
        });
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
