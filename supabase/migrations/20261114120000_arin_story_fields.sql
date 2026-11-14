-- 아린 이야기 JSON의 배경 키와 확언 3개(D-50). (docs/DATA_MODEL.md)
-- 배경 키 12개와 확언 배열은 packages/shared arinStorySchema와 같다.

alter table public.stories
  add column image_hint text check (
    image_hint is null or image_hint in (
      'penthouse', 'dressroom', 'contract', 'cafe', 'coffee', 'dinner',
      'wedding', 'paris', 'jeju', 'yoga', 'brunch', 'drive'
    )
  ),
  add column affirmations jsonb check (
    affirmations is null
    or (
      jsonb_typeof(affirmations) = 'array'
      and jsonb_array_length(affirmations) = 3
    )
  );
