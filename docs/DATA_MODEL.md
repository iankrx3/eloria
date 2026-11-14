# 데이터 모델

Supabase Postgres가 단일 원천이다. 모든 테이블은 `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`를 기본으로 가지며 아래 표에서는 생략한다. `updated_at`이 필요한 테이블은 공통 트리거를 쓴다.

## 1. RLS 원칙

| 유형 | 정책 |
| --- | --- |
| 사용자 소유(`user_id` 컬럼) | select·insert·update·delete 모두 `user_id = auth.uid()` |
| 공용 카탈로그(`voices`, `soundscapes`, `library_items`, 공용 `affirmations`) | 로그인 사용자 select만, 쓰기는 service role |
| 서버 전용(`generation_jobs`, `subscriptions`, `webhook_events`, `push_tokens` 쓰기) | 사용자는 본인 행 select만(또는 불가), 쓰기는 service role |

`stories`처럼 서버가 만들고 사용자가 읽는 테이블은 사용자 insert를 막고 select·일부 update(`is_favorite` 등)만 허용한다. 사용자가 바꿀 수 있는 컬럼은 별도 테이블(`favorites`)로 빼는 것을 우선한다.

## 2. 사용자

**profiles** (id = auth.users.id)
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| display_name | text | 스토리에서 부를 이름 |
| name_pronunciation | text null | 발음 교정 표기(예: "서아") |
| relationship_status | text | single, dating, complicated, married |
| tone | text | calm, excited, powerful |
| preferred_voice_id | uuid null → voices | |
| preferred_soundscape_id | uuid null → soundscapes | |
| listen_time | text | morning, commute, night |
| notify_at | time null | 로컬 시간 |
| timezone | text | 기본 Asia/Seoul |
| likes | text[] | Personal: 좋아하는 것 |
| dislikes | text[] | Personal: 싫어하는 것 |
| onboarding_completed_at | timestamptz null | |
| last_active_at | timestamptz | 데일리 사전 생성 대상 판단 |
| location, occupation | text null(≤40) | 마이페이지 사는 곳·하는 일(P01) |
| desired_changes | text[] | 목표 수정(H13) 바라는 변화. `DESIRED_CHANGES` 값만 |
| story_scenes | jsonb | 목표 수정 장면 `[{ text, tag }]`, 최대 5개(`storyScenesSchema`) |
| narrator_speed | numeric(2,1) | 0.9, 1.0, 1.1 |
| affirmation_notify_at | time | 확언 알림 시간, 기본 08:00 |
| notify_affirmation, notify_story, notify_challenge | boolean | 알림 토글(P02). 기본 true, true, false |
| vision_photo_path | text null | 홈 비전 사진(`vision-photos` 본인 경로) |
| challenge_started_on | date null | 21일 챌린지 시작일 |

**quiz_answers**: user_id, question_key text, answer jsonb, unique(user_id, question_key). 키와 답 형식은 `packages/shared/src/quiz.ts`(퀴즈 v2, D-39). 나이·성별은 프로필 컬럼 없이 여기에 두고 마이페이지에서도 같은 API로 고친다. 이전 퀴즈의 키는 남아 있어도 읽을 때 버린다

**people** (소중한 사람): user_id, name, relation text(partner, family, friend, pet, other), pronunciation text null

**desires** (꿈): user_id, text(≤200자), category text(wealth, love, career, health, confidence, other), status text(active, achieved, archived), achieved_at timestamptz null, visions jsonb null(비전 고르기 장면 ≤4개, `visionSchema`의 title·hint·position·storyId. 예전 summary는 읽을 때 hint. 서버가 쓰고 본인이 읽는다, 마이그레이션 20261112120000)

**consents**: user_id, kind text(privacy, marketing, ai_processing), version text, granted boolean, granted_at — 바꿀 때마다 새 행을 쌓고 가장 최근 행으로 판단한다(설정 P02 혜택·이벤트 소식, 버전 `marketing-v1`)

## 3. 콘텐츠

**stories**
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| user_id | uuid null | 공용 Library 스토리는 null |
| desire_id | uuid null → desires | |
| kind | text | on_demand, daily, library |
| version | int | 같은 꿈 안의 버전 번호 |
| parent_story_id | uuid null | 수정본이면 원본 |
| revision_request | text null | 수정 요청 원문 |
| status | text | queued, planning, writing, reviewing, text_ready, audio_ready, ready, failed |
| title | text | |
| scene_plan | jsonb null | 라이브러리·첫 이야기는 `ScenePlan`(AI_PIPELINE 4.1). 아린 이야기는 null |
| script | text | 최종 스크립트 |
| script_chars | int | |
| voice_id | uuid null → voices | tts 단계에서 정한다(voices 시드 전에도 생성 흐름을 돌리려고 null 허용) |
| prompt_version | text | 라이브러리·첫 이야기 예: scene-plan@v2+story@v1+safety@v1. 아린 이야기(D-51)는 `arin-story@v1` |
| vision | jsonb null | 비전 고르기에서 고른 장면(`visionSchema`: title, hint, position, storyId). 예전 행의 summary는 읽을 때 hint가 된다. 이 값이 있는 on_demand는 아린 JSON으로 쓰고, 한국 시간 하루 3회에 센다 |
| image_hint | text null | 아린 이야기 배경 키 12개 중 하나(D-50, 마이그레이션 20261114120000). 앱은 번들 사진에 임시로 붙인다 |
| arin_story | jsonb null | 아린 이야기 JSON 원문(D-51, 마이그레이션 20261114130000). 수정할 때 이전 이야기로 다시 보낸다 |
| affirmations | jsonb null | 아린 이야기 확언 3줄. 원소 3개인 배열이거나 null |
| daily_on | date null | 데일리(kind = daily)의 날짜(사용자 시간대 자정, D-50). `(user_id, daily_on)` 유일 |
| error_code | text null | ENQUEUE_FAILED, SAFETY_BLOCKED, SAFETY_CRISIS(도움 안내 화면), TTS_FAILED(텍스트는 계속 읽기 가능), TTS_BUDGET(음성 크레딧 상한, 텍스트는 계속 읽기 가능, D-49), AI_BUSY(하루 호출 상한·공급자 한도), GENERATION_FAILED |
| updated_at | timestamptz | 공통 트리거 |

`stories`는 Realtime 발행(`supabase_realtime`)에 들어 있다. 생성 진행 화면이 상태 변화를 구독한다. RLS: 본인 스토리와 `kind = library`만 select. 제약: library는 `user_id`가 null, 그 외는 not null.

**story_assets**: story_id, type text(audio, cover, mixed_audio), storage_path text, duration_sec numeric null, mime text, bytes int, content_hash text(캐시 키), provider text, model text

**voices**: key text unique, display_name, provider_voice_id text, model text, language text, preview_path text, is_active boolean, owner_user_id uuid null(P2 클론) — 시드: harin·seoa·yuna·jiho(마이그레이션 20261111140000, ElevenLabs 연결 전이라 `provider_voice_id = mock-*`, `model = mock`)

**soundscapes**: key text unique, display_name, storage_path, loop_duration_sec, is_active

**library_items**: story_id unique → stories(kind=library, on delete cascade), category text(money, love, career, confidence, meditation, affirmation, frequency, sleep, song), wish_theme text null(exam, home, job, love, body, travel — L06 소원별로 듣기), seed_key text unique(시드 카탈로그 key), theme text(생성 테마, 1~200자), tone text(calm, excited, powerful), sort int(카테고리 안 순서), is_free boolean — 로그인 사용자 select, 쓰기는 service role(마이그레이션 20261004130000). 음성은 `story-audio/library/{story_id}/…`라 앱은 서버 서명 URL(`GET /v1/stories/:id/media`)로 받는다. 주파수(`frequency-*`)는 파이프라인 없이 합성 MP3를 올린 ready 스토리다(`story_assets.provider = synth`, D-47)

**affirmations** (오늘의 확언, A01): user_id, day date, position int(1~10, 지금은 1~3만 저장), text(≤120자), theme text null, status text(approved, blocked), prompt_version text null, unique(user_id, day, position) — 서버(service role)만 쓰고 사용자는 본인의 `approved`만 select(마이그레이션 20261111120000). 내용은 그날 이야기 확언 3줄이거나 기본 3줄(D-50)

**saved_affirmations**: user_id, affirmation_id, saved_at, primary key(user_id, affirmation_id) — 본인 행 RLS

## 4. 활동

**playlists**: user_id, title, desire_id null
**playlist_items**: playlist_id, story_id, sort
**favorites**: user_id, story_id, unique(user_id, story_id) — RLS: 본인 select·delete, insert는 볼 수 있는 스토리(본인 또는 library)에만. 앱이 직접 쓴다(마이그레이션 20261003150000)
**play_events**: user_id, story_id, event text(start, progress_25, progress_50, progress_75, progress_90, complete), position_sec, occurred_at, platform
**gratitude_entries** (감사 일기, 마이 보관함): user_id, day date, lines text[](1~3줄, 줄당 ≤100자는 앱 `cleanGratitudeLines`), unique(user_id, day) — 본인 행 RLS, 앱이 직접 upsert
**activity_days** (연속 기록, H11): user_id, day date, stories_listened int, affirmations_done int, primary key(user_id, day) — 본인 행 RLS, 앱이 직접 기록. 그날 이야기 1개를 끝까지(90%) 듣거나 확언 3장을 넘기면 기록한 날(`ACTIVITY_RULE`, `packages/shared/src/activity.ts`)
**challenge_missions** (21일 챌린지, H12): day int(1~21) primary key, kind text(affirm, gratitude, visualize, listen, write), title, body — 로그인 사용자 select, 시드는 마이그레이션 20261111140000
**challenge_progress**: user_id, day → challenge_missions, completed_at, note text null, primary key(user_id, day) — 본인 행 RLS. 하루 1개씩 열리고 놓친 날은 이어서 진행(`challengeState`)
**wall_entries**: user_id, desire_id null, title, note, photo_path null, achieved_on date

## 5. 운영

**subscriptions**: user_id unique, status text(active, trialing, grace, expired, none), product_id, store text(app_store, play_store), period_end timestamptz, rc_app_user_id, updated_from_event_id
**webhook_events**: source text(revenuecat, elevenlabs), event_id text unique, payload jsonb, processed_at
**generation_jobs**: user_id, story_id null, kind text(story, revision, daily, affirmation, affirmation_audio, cover, library, lifestyle), step text, status text(pending, running, succeeded, failed), attempts int, provider text, model text, input_tokens int, output_tokens int, tts_chars int, image_count int, est_cost_usd numeric(10,5), error text, started_at, finished_at — RLS만 켜고 정책 없음(사용자 접근 불가, service role 전용)
**generation_quota** (뷰): user_id, month, stories_used, daily_used, revisions_used — `generation_jobs`의 스토리별 전체 진행 행(`provider is null`, 생성 요청 때 하나씩 생김)을 세어 집계(마이그레이션 20261004090000). 스토리를 지워도 `story_id`만 null이 되고 행은 남아 사용량이 줄지 않는다. `security_invoker`, anon·authenticated 권한 없음(서버 전용)
**push_tokens**: user_id, token text unique(Expo 푸시 토큰, 기기당 하나라 다른 계정으로 로그인하면 행이 그 사용자로 옮겨 감), platform text(ios, android), created_at, updated_at — 본인 select만, 쓰기는 service role(마이그레이션 20261004110000)
**promo_codes**: code unique, grants text(free_month 등), max_uses, used_count, creator_name, expires_at
**referrals**: code, user_id, redeemed_at
**account_deletions** (회원 탈퇴 사유, P04): reasons text[](`DELETE_REASONS`), created_at — 누구인지 남기지 않는다. RLS만 켜고 정책 없음(service role 전용)
**app_config**: key text primary key, value jsonb, updated_at — 원가 한도 등 원격 설정(`AI_PIPELINE.md` 6절). 로그인 사용자 select, 쓰기는 service role

## 6. 스토리지 버킷

| 버킷 | 공개 | 경로 규칙 |
| --- | --- | --- |
| `story-audio` | private | `{user_id or 'library'}/{story_id}/{asset_id}.mp3` |
| `story-covers` | private | `{user_id or 'library'}/{story_id}/{asset_id}.png` |
| `affirmation-audio` | private | `{hash}.mp3` (캐시 공유, 서명 URL로만 접근) |
| `wall-photos` | private | `{user_id}/{wall_entry_id}.jpg` |
| `vision-photos` | private | `{user_id}/vision-{timestamp}.{jpg,png,webp}`(5MB) |
| `soundscapes` | public | `{key}.mp3` (합성 mock은 `{key}.wav`) |
| `voice-previews` | public | `{voice_key}.mp3` |

private 버킷은 첫 경로 세그먼트가 `auth.uid()`인 경우만 select를 허용하고, `library`·해시 경로는 서명 URL로만 내려준다. 현재 만든 버킷: `story-audio`, `story-covers`, `soundscapes`, `voice-previews`(마이그레이션 20261003120000), `vision-photos`(20261111120000, 본인 폴더 select·insert·update·delete). `affirmation-audio`, `wall-photos`는 해당 기능 때 만든다.

## 7. 변경 절차

1. `supabase/migrations/<timestamp>_<name>.sql` 추가(기존 파일 수정 금지)
2. RLS 정책을 같은 파일에 작성
3. `pnpm db:reset` → `pnpm db:types`
4. 이 문서 갱신
