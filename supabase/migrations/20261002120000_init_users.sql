-- M1 첫 마이그레이션: 사용자 관련 테이블 + RLS (docs/DATA_MODEL.md 2절, 5절 app_config)
-- 모든 사용자 데이터는 user_id = auth.uid() 정책. 익명 사용자도 authenticated 역할이다.

-- ── 공통: updated_at 트리거 ──────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── profiles (id = auth.users.id) ────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 20),
  name_pronunciation text check (char_length(name_pronunciation) <= 40),
  relationship_status text check (relationship_status in ('single', 'dating', 'complicated', 'married')),
  tone text check (tone in ('calm', 'excited', 'powerful')),
  -- voices·soundscapes 테이블은 M2 마이그레이션에서 만들고 FK를 추가한다.
  preferred_voice_id uuid,
  preferred_soundscape_id uuid,
  listen_time text check (listen_time in ('morning', 'commute', 'night')),
  notify_at time,
  timezone text not null default 'Asia/Seoul',
  likes text[] not null default '{}',
  dislikes text[] not null default '{}',
  onboarding_completed_at timestamptz,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 가입(익명 포함) 시 빈 프로필을 만든다. ARCHITECTURE 1절에서 허용한 유일한 DB 로직.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles: 본인 조회" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: 본인 수정" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
-- insert는 트리거, delete는 계정 삭제 작업(service role)만 한다.

-- ── quiz_answers ─────────────────────────────────────────────────────
create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_key text not null,
  answer jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_key)
);

create trigger quiz_answers_set_updated_at
  before update on public.quiz_answers
  for each row execute function public.set_updated_at();

-- ── people (소중한 사람) ─────────────────────────────────────────────
create table public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  relation text not null check (relation in ('partner', 'family', 'friend', 'pet', 'other')),
  pronunciation text check (char_length(pronunciation) <= 40),
  created_at timestamptz not null default now()
);

create index people_user_id_idx on public.people (user_id);

-- ── desires (꿈) ─────────────────────────────────────────────────────
create table public.desires (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 200),
  category text not null default 'other'
    check (category in ('wealth', 'love', 'career', 'health', 'confidence', 'other')),
  status text not null default 'active' check (status in ('active', 'achieved', 'archived')),
  achieved_at timestamptz,
  created_at timestamptz not null default now()
);

create index desires_user_id_idx on public.desires (user_id);

-- ── consents ─────────────────────────────────────────────────────────
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('privacy', 'marketing', 'ai_processing')),
  version text not null,
  granted boolean not null,
  granted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index consents_user_id_idx on public.consents (user_id);

-- ── 사용자 소유 테이블 공통 RLS ──────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array['quiz_answers', 'people', 'desires', 'consents'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "%1$s: 본인 조회" on public.%1$I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "%1$s: 본인 추가" on public.%1$I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "%1$s: 본인 수정" on public.%1$I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "%1$s: 본인 삭제" on public.%1$I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;

-- ── app_config (원격 설정, AI_PIPELINE 6절) ──────────────────────────
create table public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger app_config_set_updated_at
  before update on public.app_config
  for each row execute function public.set_updated_at();

alter table public.app_config enable row level security;

create policy "app_config: 로그인 사용자 조회" on public.app_config
  for select to authenticated using (true);
-- 쓰기는 service role만(정책 없음 = 거부).
