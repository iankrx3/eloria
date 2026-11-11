-- ARIN Figma 기능(DECISIONS D-44): 프로필 추가 정보·설정, 활동 기록(연속 기록), 21일 챌린지, 감사 일기,
-- 오늘의 확언과 저장, 라이브러리 콘텐츠 종류·소원 테마, 비전 사진 버킷, 회원 탈퇴 사유. (docs/DATA_MODEL.md)

-- ── profiles: 마이페이지 기본 정보·목표 장면·설정 ──────────────────────
alter table public.profiles
  add column location text check (char_length(location) <= 40),
  add column occupation text check (char_length(occupation) <= 40),
  -- 목표 수정(H13) "장면": 이야기 생성 기본 소재, 최대 5개
  add column story_scenes text[] not null default '{}' check (cardinality(story_scenes) <= 5),
  add column narrator_speed numeric(2, 1) not null default 1.0 check (narrator_speed in (0.9, 1.0, 1.1)),
  add column affirmation_notify_at time not null default '08:00',
  add column notify_affirmation boolean not null default true,
  add column notify_story boolean not null default true,
  add column notify_challenge boolean not null default false,
  -- 비전 사진(H01): vision-photos 버킷의 본인 경로
  add column vision_photo_path text check (char_length(vision_photo_path) <= 300),
  add column challenge_started_on date;

-- ── 활동 기록: 하루에 이야기 1개를 끝까지 듣거나 확언 10장을 넘기면 그날 기록(H11) ──
create table public.activity_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  stories_listened int not null default 0 check (stories_listened >= 0),
  affirmations_done int not null default 0 check (affirmations_done between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- ── 21일 챌린지(H12): 미션은 운영자가 시드, 진행은 본인 ─────────────────
create table public.challenge_missions (
  day int primary key check (day between 1 and 21),
  kind text not null check (kind in ('affirm', 'gratitude', 'visualize', 'listen', 'write')),
  title text not null check (char_length(title) between 1 and 60),
  body text not null check (char_length(body) between 1 and 300)
);

create table public.challenge_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  day int not null references public.challenge_missions (day),
  completed_at timestamptz not null default now(),
  note text check (char_length(note) <= 500),
  primary key (user_id, day)
);

-- ── 감사 일기(마이 보관함, PRD F-24): 하루 3줄 ────────────────────────
create table public.gratitude_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  lines text[] not null check (cardinality(lines) between 1 and 3),
  created_at timestamptz not null default now(),
  unique (user_id, day)
);

-- ── 오늘의 확언(A01): 서버가 만들고 안전 검수를 통과한 것만 보인다 ──────────
create table public.affirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  position int not null check (position between 1 and 10),
  text text not null check (char_length(text) between 1 and 120),
  theme text check (char_length(theme) <= 40),
  status text not null default 'approved' check (status in ('approved', 'blocked')),
  prompt_version text,
  created_at timestamptz not null default now(),
  unique (user_id, day, position)
);
create index affirmations_user_day_idx on public.affirmations (user_id, day);

create table public.saved_affirmations (
  user_id uuid not null references auth.users (id) on delete cascade,
  affirmation_id uuid not null references public.affirmations (id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, affirmation_id)
);

-- ── RLS: 본인 행 ─────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array['activity_days', 'challenge_progress', 'gratitude_entries', 'saved_affirmations'] loop
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

alter table public.challenge_missions enable row level security;
create policy "challenge_missions: 로그인 사용자 조회" on public.challenge_missions
  for select to authenticated using (true);

-- 확언은 서버(service role)만 쓴다. 사용자는 본인의 통과한 확언만 읽는다.
alter table public.affirmations enable row level security;
create policy "affirmations: 본인 통과 확언 조회" on public.affirmations
  for select to authenticated
  using ((select auth.uid()) = user_id and status = 'approved');

-- ── 라이브러리: 콘텐츠 종류와 소원 테마(L01·L06) ──────────────────────
alter table public.library_items drop constraint library_items_category_check;
alter table public.library_items
  add constraint library_items_category_check check (
    category in ('money', 'love', 'career', 'confidence', 'meditation', 'affirmation', 'frequency', 'sleep', 'song')
  ),
  add column wish_theme text check (wish_theme in ('exam', 'home', 'job', 'love', 'body', 'travel'));
create index library_items_wish_theme_idx on public.library_items (wish_theme) where wish_theme is not null;

-- ── 생성 기록 종류: 확언 글·라이프스타일 추천 ───────────────────────────
alter table public.generation_jobs drop constraint generation_jobs_kind_check;
alter table public.generation_jobs
  add constraint generation_jobs_kind_check check (
    kind in ('story', 'revision', 'daily', 'affirmation', 'affirmation_audio', 'cover', 'library', 'lifestyle')
  );

-- ── 회원 탈퇴 사유(P04): 누구인지 남기지 않는다. 서버만 쓰고 읽는다 ──────────
create table public.account_deletions (
  id uuid primary key default gen_random_uuid(),
  reasons text[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.account_deletions enable row level security;

-- ── 비전 사진 버킷(private): 본인 폴더만 읽기·쓰기 ─────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vision-photos', 'vision-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "vision photos: 본인 폴더 조회" on storage.objects
  for select to authenticated
  using (bucket_id = 'vision-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "vision photos: 본인 폴더 올리기" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vision-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "vision photos: 본인 폴더 바꾸기" on storage.objects
  for update to authenticated
  using (bucket_id = 'vision-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "vision photos: 본인 폴더 지우기" on storage.objects
  for delete to authenticated
  using (bucket_id = 'vision-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
