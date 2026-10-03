import type { z } from 'zod';
import { api } from './api';
import { ApiClientError } from './api-client';
import { supabase } from './supabase';

type Options<T extends z.ZodType> = Omit<Parameters<typeof api<T>>[1] & object, 'accessToken'>;

/** 현재 세션의 access token을 붙여 API를 부른다. 토큰은 호출 시점에 읽어 갱신된 값을 쓴다. */
export async function authedApi<T extends z.ZodType>(path: string, options: Options<T> = {}) {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new ApiClientError('UNAUTHORIZED', 'no session');
  return api(path, { ...options, accessToken });
}
