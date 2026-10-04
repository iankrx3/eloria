-- 리추얼(공용 Library) 항목(docs/DATA_MODEL.md 3절). 스토리 본문·음성은 stories(kind = library)와
-- story_assets에 두고, 이 표는 카테고리·순서·무료 여부와 생성용 테마를 담는다. 쓰기는 서버(seedLibrary)만 한다.

create table public.library_items (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null unique references public.stories (id) on delete cascade,
  category text not null check (category in ('money', 'love', 'career', 'confidence', 'meditation')),
  -- 시드 카탈로그(apps/api/src/library/catalog.ts)의 key. 시드를 다시 돌려도 같은 항목을 또 만들지 않는다.
  seed_key text not null unique,
  theme text not null check (char_length(theme) between 1 and 200),
  tone text not null check (tone in ('calm', 'excited', 'powerful')),
  sort int not null default 0,
  is_free boolean not null default false,
  created_at timestamptz not null default now()
);

create index library_items_category_sort_idx on public.library_items (category, sort);

alter table public.library_items enable row level security;

create policy "library_items: 로그인 사용자 조회" on public.library_items
  for select to authenticated using (true);
-- insert·update·delete는 service role만(정책 없음).
