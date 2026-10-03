-- M2: 스토리 생성 루프 테이블, 스토리지 버킷, Realtime (docs/DATA_MODEL.md 3절, 5절, 6절)
-- 서버(service role)가 만들고 사용자는 읽기만 한다. 사용자가 바꾸는 값은 별도 테이블로 둔다(favorites 등, 이후).

-- ── voices (공용 카탈로그) ──────────────────────────────────────────
create table public.voices (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  display_name text not null,
  provider_voice_id text not null,
  model text not null,
  language text not null default 'ko',
  preview_path text,
  is_active boolean not null default true,
  owner_user_id uuid references auth.users (id) on delete cascade, -- P2 내 목소리(클론)
  created_at timestamptz not null default now()
);

alter table public.voices enable row level security;
create policy "voices: 공용·본인 보이스 조회" on public.voices
  for select to authenticated
  using (is_active and (owner_user_id is null or owner_user_id = (select auth.uid())));

-- ── soundscapes (공용 카탈로그) ─────────────────────────────────────
create table public.soundscapes (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  display_name text not null,
  storage_path text not null,
  loop_duration_sec numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.soundscapes enable row level security;
create policy "soundscapes: 로그인 사용자 조회" on public.soundscapes
  for select to authenticated using (is_active);

-- 첫 마이그레이션에서 미뤄 둔 profiles FK
alter table public.profiles
  add constraint profiles_preferred_voice_id_fkey
    foreign key (preferred_voice_id) references public.voices (id) on delete set null,
  add constraint profiles_preferred_soundscape_id_fkey
    foreign key (preferred_soundscape_id) references public.soundscapes (id) on delete set null;

-- ── stories ──────────────────────────────────────────────────────────
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade, -- 공용 Library 스토리는 null
  desire_id uuid references public.desires (id) on delete set null,
  kind text not null check (kind in ('on_demand', 'daily', 'library')),
  version int not null default 1 check (version >= 1),
  parent_story_id uuid references public.stories (id) on delete set null,
  revision_request text check (char_length(revision_request) <= 200),
  status text not null default 'queued' check (
    status in ('queued', 'planning', 'writing', 'reviewing', 'text_ready', 'audio_ready', 'ready', 'failed')
  ),
  title text,
  scene_plan jsonb,
  script text,
  script_chars int,
  -- 보이스는 tts 단계에서 정한다. voices 시드 전에도 생성 흐름을 돌릴 수 있게 null을 허용한다.
  voice_id uuid references public.voices (id) on delete set null,
  prompt_version text,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stories_library_has_no_owner check ((kind = 'library') = (user_id is null))
);

create index stories_user_id_created_at_idx on public.stories (user_id, created_at desc);
create index stories_desire_id_idx on public.stories (desire_id);

create trigger stories_set_updated_at
  before update on public.stories
  for each row execute function public.set_updated_at();

alter table public.stories enable row level security;
create policy "stories: 본인 스토리와 공용 Library 조회" on public.stories
  for select to authenticated
  using (user_id = (select auth.uid()) or kind = 'library');
-- insert·update·delete는 서버(service role)만.

-- ── story_assets ─────────────────────────────────────────────────────
create table public.story_assets (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  type text not null check (type in ('audio', 'cover', 'mixed_audio')),
  storage_path text not null,
  duration_sec numeric,
  mime text not null,
  bytes int,
  content_hash text, -- 음성 캐시 키(AI_PIPELINE 7절)
  provider text,
  model text,
  created_at timestamptz not null default now()
);

create index story_assets_story_id_idx on public.story_assets (story_id);
create index story_assets_content_hash_idx on public.story_assets (content_hash) where content_hash is not null;

alter table public.story_assets enable row level security;
create policy "story_assets: 볼 수 있는 스토리의 에셋 조회" on public.story_assets
  for select to authenticated
  using (
    exists (
      select 1 from public.stories s
      where s.id = story_id and (s.user_id = (select auth.uid()) or s.kind = 'library')
    )
  );

-- ── generation_jobs (서버 전용) ──────────────────────────────────────
create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade, -- library 시드는 null
  story_id uuid references public.stories (id) on delete set null,
  kind text not null check (kind in ('story', 'revision', 'daily', 'affirmation_audio', 'cover', 'library')),
  step text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'succeeded', 'failed')),
  attempts int not null default 0,
  provider text,
  model text,
  input_tokens int,
  output_tokens int,
  tts_chars int,
  image_count int,
  est_cost_usd numeric(10, 5),
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index generation_jobs_user_id_created_at_idx on public.generation_jobs (user_id, created_at desc);
create index generation_jobs_story_id_idx on public.generation_jobs (story_id);

-- RLS만 켜고 정책은 두지 않는다 = 사용자 접근 불가, service role만 읽고 쓴다.
alter table public.generation_jobs enable row level security;

-- ── generation_quota (서버 전용 집계 뷰) ─────────────────────────────
-- 한도 판단은 서버에서만 한다(CLAUDE.md). 스토리 단위로 세므로 단계별 행이 여러 개여도 한 번만 센다.
create view public.generation_quota
with (security_invoker = true) as
select
  user_id,
  date_trunc('month', created_at) as month,
  count(distinct story_id) filter (where kind = 'story') as stories_used,
  count(distinct story_id) filter (where kind = 'daily') as daily_used,
  count(distinct story_id) filter (where kind = 'revision') as revisions_used
from public.generation_jobs
where user_id is not null
group by user_id, date_trunc('month', created_at);

revoke all on public.generation_quota from anon, authenticated;

-- ── Realtime: 생성 진행 화면이 stories 상태 변화를 구독한다(ARCHITECTURE 2.1) ──
alter publication supabase_realtime add table public.stories;

-- ── 스토리지 버킷(DATA_MODEL 6절) ───────────────────────────────────
insert into storage.buckets (id, name, public)
values
  ('story-audio', 'story-audio', false),
  ('story-covers', 'story-covers', false),
  ('soundscapes', 'soundscapes', true),
  ('voice-previews', 'voice-previews', true)
on conflict (id) do nothing;

-- private 버킷은 첫 경로 세그먼트가 본인 user_id인 파일만 읽을 수 있다.
-- library·해시 경로는 서버가 서명 URL로만 내려준다(API.md GET /v1/stories/:id/media). 쓰기는 service role만.
create policy "story files: 본인 폴더 조회" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('story-audio', 'story-covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
