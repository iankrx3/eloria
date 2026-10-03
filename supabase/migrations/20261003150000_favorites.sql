-- 좋아요(docs/DATA_MODEL.md 4절). 사용자가 바꾸는 값은 stories에 두지 않고 별도 테이블로 둔다(1절).

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  story_id uuid not null references public.stories (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, story_id)
);

create index favorites_story_id_idx on public.favorites (story_id);

alter table public.favorites enable row level security;

create policy "favorites: 본인 조회" on public.favorites
  for select to authenticated using ((select auth.uid()) = user_id);

-- 볼 수 있는 스토리(본인 것 또는 공용 Library)에만 좋아요를 누를 수 있다.
create policy "favorites: 본인 추가" on public.favorites
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.stories s
      where s.id = story_id and (s.user_id = (select auth.uid()) or s.kind = 'library')
    )
  );

create policy "favorites: 본인 삭제" on public.favorites
  for delete to authenticated using ((select auth.uid()) = user_id);
-- update는 필요 없다(행이 있으면 좋아요, 없으면 아님).
