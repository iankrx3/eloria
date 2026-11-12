-- 비전 고르기(H05)와 매일 새 이야기(D-48). (docs/DATA_MODEL.md)

-- ── 비전: 한 꿈 입력에 장면 4개. 서버가 만들고(service role) 앱은 본인 꿈으로 읽는다 ──
-- 각 원소는 packages/shared visionSchema(position·title·summary·place·timeOfDay·storyId)로 검증한다.
alter table public.desires
  add column visions jsonb check (
    visions is null or (jsonb_typeof(visions) = 'array' and jsonb_array_length(visions) <= 4)
  );

-- ── 스토리: 고른 비전(생성 씨앗)과 데일리 날짜 ─────────────────────────────
alter table public.stories
  add column vision jsonb check (vision is null or jsonb_typeof(vision) = 'object'),
  -- 사용자 시간대 기준 그날의 데일리. 하루 한 편만(아래 유일 색인).
  add column daily_on date,
  add constraint stories_daily_on_only_daily check (daily_on is null or kind = 'daily');

create unique index stories_user_daily_on_key
  on public.stories (user_id, daily_on)
  where daily_on is not null;

-- ── 생성 기록 종류: 비전 장면 제안 ─────────────────────────────────────────
alter table public.generation_jobs drop constraint generation_jobs_kind_check;
alter table public.generation_jobs
  add constraint generation_jobs_kind_check check (
    kind in (
      'story', 'revision', 'daily', 'affirmation', 'affirmation_audio', 'cover', 'library',
      'lifestyle', 'vision'
    )
  );
