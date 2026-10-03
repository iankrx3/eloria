-- 스토리를 지워도 생성 한도 사용량이 줄지 않게 한다.
-- generation_jobs.story_id는 스토리 삭제 시 null이 되므로(on delete set null) story_id로 세면 사용량이 사라진다.
-- 대신 스토리마다 하나씩 만드는 전체 진행 행(provider가 null인 행, API가 생성 요청 때 만든다)을 센다.
create or replace view public.generation_quota
with (security_invoker = true) as
select
  user_id,
  date_trunc('month', created_at) as month,
  count(*) filter (where kind = 'story' and provider is null) as stories_used,
  count(*) filter (where kind = 'daily' and provider is null) as daily_used,
  count(*) filter (where kind = 'revision' and provider is null) as revisions_used
from public.generation_jobs
where user_id is not null
group by user_id, date_trunc('month', created_at);

revoke all on public.generation_quota from anon, authenticated;
