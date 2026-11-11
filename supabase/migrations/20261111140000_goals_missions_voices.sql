-- 목표 수정(H13)·21일 챌린지 미션·내레이터 목소리 시드(DECISIONS D-44)

-- ── 목표 수정: 바라는 변화(여러 개)와 장면(글 + 바라는 변화 태그, 최대 5개) ──
alter table public.profiles drop column story_scenes;
alter table public.profiles
  add column desired_changes text[] not null default '{}' check (
    cardinality(desired_changes) <= 8
    and desired_changes <@ array['wealth', 'love', 'career', 'home', 'health', 'travel', 'family', 'self_love']
  ),
  add column story_scenes jsonb not null default '[]'::jsonb check (
    jsonb_typeof(story_scenes) = 'array' and jsonb_array_length(story_scenes) <= 5
  );

-- ── 21일 챌린지 미션(운영자 문구, 결과를 약속하지 않는 경험·루틴 표현) ─────────
insert into public.challenge_missions (day, kind, title, body) values
  (1, 'affirm', '오늘의 확언을 소리 내어 읽기', '거울 앞에서 "나는 내 하루를 스스로 고를 수 있어"처럼 세 번 말해 보세요'),
  (2, 'visualize', '꿈꾸는 아침을 1분 동안 그려 보기', '눈을 감고 창밖 풍경, 공기, 들리는 소리를 떠올려 보세요'),
  (3, 'gratitude', '오늘 감사한 일 3가지 적기', '아주 작은 일이어도 괜찮아요'),
  (4, 'gratitude', '감사한 일 3가지를 이미 이뤄진 것처럼 말하기', '예: "한강이 보이는 내 방에서 눈을 떠서 감사해"'),
  (5, 'listen', '내 이야기 한 편 끝까지 듣기', '편안한 자세로 이야기 속 하루를 살아 봐요'),
  (6, 'write', '1년 뒤의 나에게 짧은 편지 쓰기', '그때의 나는 어떤 하루를 보내고 있을까요'),
  (7, 'affirm', '확언 10장 모두 넘겨 보기', '마음에 닿는 문장은 저장해 두세요'),
  (8, 'visualize', '꿈꾸는 장면 속 내 모습 떠올리기', '어떤 옷을 입고, 어떤 표정을 짓고 있나요'),
  (9, 'write', '오늘 나를 칭찬할 일 하나 적기', '스스로에게 다정하게 말해 주세요'),
  (10, 'listen', '잠들기 전 명상 한 편 듣기', '라이브러리의 명상에서 하나를 골라 보세요'),
  (11, 'gratitude', '소중한 사람에게 고마운 마음 한 줄 보내기', '짧은 메시지 하나면 충분해요'),
  (12, 'visualize', '꿈꾸는 하루의 저녁 장면 그려 보기', '누구와 함께, 어디에서 하루를 마무리하나요'),
  (13, 'affirm', '나를 응원하는 문장 세 개 만들기', '"나는 ~해도 괜찮은 사람이야"로 시작해 보세요'),
  (14, 'write', '마음에 걸리는 것을 한 문장으로 적기', '그다음, 그것을 다르게 바라보는 문장도 하나 적어 보세요'),
  (15, 'listen', '라이브러리에서 마음이 가는 콘텐츠 듣기', '오늘의 기분에 맞는 것을 골라 보세요'),
  (16, 'gratitude', '오늘 내 몸에게 고마운 점 적기', '걸어 준 다리, 웃어 준 얼굴처럼요'),
  (17, 'visualize', '원하는 삶의 공간을 비전 사진으로 올리기', '홈의 초승달 옆 사진 버튼을 눌러 보세요'),
  (18, 'affirm', '확언 하나를 하루 동안 세 번 떠올리기', '아침, 점심, 잠들기 전에 한 번씩'),
  (19, 'write', '지난 18일 동안 달라진 점 세 가지 적기', '작은 변화도 소중해요'),
  (20, 'listen', '처음 만든 이야기를 다시 듣기', '그때와 지금, 무엇이 달라졌나요'),
  (21, 'write', '21일을 함께한 나에게 한마디 남기기', '여기까지 온 나를 안아 주세요')
on conflict (day) do nothing;

-- ── 내레이터 목소리 4종(H10). 실제 ElevenLabs 보이스 ID는 보이스 확정(Q-08) 후 바꾼다 ──
insert into public.voices (key, display_name, provider_voice_id, model)
values
  ('harin', '하린', 'mock-harin', 'mock'),
  ('seoa', '서아', 'mock-seoa', 'mock'),
  ('yuna', '유나', 'mock-yuna', 'mock'),
  ('jiho', '지호', 'mock-jiho', 'mock')
on conflict (key) do nothing;
