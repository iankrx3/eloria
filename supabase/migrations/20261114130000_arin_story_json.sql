-- 아린 이야기 JSON 원문(D-51). 수정할 때 이전 이야기로 다시 보낸다.
-- 없으면 스크립트에서 문단을 나눠 복원한다.

alter table public.stories
  add column arin_story jsonb;
