-- 푸시 토큰(docs/DATA_MODEL.md 5절). 쓰기는 API(POST /v1/push-tokens, service role)만 한다.
-- 같은 기기에서 다른 계정으로 로그인하면 토큰이 새 사용자로 옮겨 가도록 token을 유일 키로 둔다.

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index push_tokens_user_id_idx on public.push_tokens (user_id);

create trigger push_tokens_set_updated_at
  before update on public.push_tokens
  for each row execute function public.set_updated_at();

alter table public.push_tokens enable row level security;

create policy "push_tokens: 본인 조회" on public.push_tokens
  for select to authenticated using ((select auth.uid()) = user_id);
-- insert·update·delete는 service role만(정책 없음).
