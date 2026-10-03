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

**quiz_answers**: user_id, question_key text, answer jsonb, unique(user_id, question_key)

**people** (소중한 사람): user_id, name, relation text(partner, family, friend, pet, other), pronunciation text null

**desires** (꿈): user_id, text(≤200자), category text(wealth, love, career, health, confidence, other), status text(active, achieved, archived), achieved_at timestamptz null

**consents**: user_id, kind text(privacy, marketing, ai_processing), version text, granted boolean, granted_at

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
| scene_plan | jsonb | `ScenePlan` 스키마(AI_PIPELINE 4.1) |
| script | text | 최종 스크립트 |
| script_chars | int | |
| voice_id | uuid null → voices | tts 단계에서 정한다(voices 시드 전에도 생성 흐름을 돌리려고 null 허용) |
| prompt_version | text | 예: story@2026-10-01 |
| error_code | text null | ENQUEUE_FAILED, SAFETY_BLOCKED, SAFETY_CRISIS(도움 안내 화면), TTS_FAILED(텍스트는 계속 읽기 가능), GENERATION_FAILED |
| updated_at | timestamptz | 공통 트리거 |

`stories`는 Realtime 발행(`supabase_realtime`)에 들어 있다. 생성 진행 화면이 상태 변화를 구독한다. RLS: 본인 스토리와 `kind = library`만 select. 제약: library는 `user_id`가 null, 그 외는 not null.

**story_assets**: story_id, type text(audio, cover, mixed_audio), storage_path text, duration_sec numeric null, mime text, bytes int, content_hash text(캐시 키), provider text, model text

**voices**: key text unique, display_name, provider_voice_id text, model text, language text, preview_path text, is_active boolean, owner_user_id uuid null(P2 클론)

**soundscapes**: key text unique, display_name, storage_path, loop_duration_sec, is_active

**library_items**: category text(money, love, career, confidence, meditation), story_id → stories(kind=library), sort int, is_free boolean

**affirmations**: user_id uuid null(null = 공용), category, text, audio_path text null, audio_hash text null, source text(library, generated)

**saved_affirmations**: user_id, affirmation_id, unique(user_id, affirmation_id)

## 4. 활동

**playlists**: user_id, title, desire_id null
**playlist_items**: playlist_id, story_id, sort
**favorites**: user_id, story_id, unique(user_id, story_id) — RLS: 본인 select·delete, insert는 볼 수 있는 스토리(본인 또는 library)에만. 앱이 직접 쓴다(마이그레이션 20261003150000)
**play_events**: user_id, story_id, event text(start, progress_25, progress_50, progress_75, progress_90, complete), position_sec, occurred_at, platform
**gratitude_entries**: user_id, entry_date date, lines text[3], unique(user_id, entry_date)
**wall_entries**: user_id, desire_id null, title, note, photo_path null, achieved_on date
**streaks** (뷰 또는 테이블): user_id, current_days, longest_days, last_listen_date

## 5. 운영

**subscriptions**: user_id unique, status text(active, trialing, grace, expired, none), product_id, store text(app_store, play_store), period_end timestamptz, rc_app_user_id, updated_from_event_id
**webhook_events**: source text(revenuecat, elevenlabs), event_id text unique, payload jsonb, processed_at
**generation_jobs**: user_id, story_id null, kind text(story, revision, daily, affirmation_audio, cover, library), step text, status text(pending, running, succeeded, failed), attempts int, provider text, model text, input_tokens int, output_tokens int, tts_chars int, image_count int, est_cost_usd numeric(10,5), error text, started_at, finished_at — RLS만 켜고 정책 없음(사용자 접근 불가, service role 전용)
**generation_quota** (뷰): user_id, month, stories_used, daily_used, revisions_used — `generation_jobs`의 스토리별 전체 진행 행(`provider is null`, 생성 요청 때 하나씩 생김)을 세어 집계(마이그레이션 20261004090000). 스토리를 지워도 `story_id`만 null이 되고 행은 남아 사용량이 줄지 않는다. `security_invoker`, anon·authenticated 권한 없음(서버 전용)
**push_tokens**: user_id, token text unique(Expo 푸시 토큰, 기기당 하나라 다른 계정으로 로그인하면 행이 그 사용자로 옮겨 감), platform text(ios, android), created_at, updated_at — 본인 select만, 쓰기는 service role(마이그레이션 20261004110000)
**promo_codes**: code unique, grants text(free_month 등), max_uses, used_count, creator_name, expires_at
**referrals**: code, user_id, redeemed_at
**deletion_requests**: user_id, requested_at, completed_at null
**app_config**: key text primary key, value jsonb, updated_at — 원가 한도 등 원격 설정(`AI_PIPELINE.md` 6절). 로그인 사용자 select, 쓰기는 service role

## 6. 스토리지 버킷

| 버킷 | 공개 | 경로 규칙 |
| --- | --- | --- |
| `story-audio` | private | `{user_id or 'library'}/{story_id}/{asset_id}.mp3` |
| `story-covers` | private | `{user_id or 'library'}/{story_id}/{asset_id}.png` |
| `affirmation-audio` | private | `{hash}.mp3` (캐시 공유, 서명 URL로만 접근) |
| `wall-photos` | private | `{user_id}/{wall_entry_id}.jpg` |
| `soundscapes` | public | `{key}.mp3` |
| `voice-previews` | public | `{voice_key}.mp3` |

private 버킷은 첫 경로 세그먼트가 `auth.uid()`인 경우만 select를 허용하고, `library`·해시 경로는 서명 URL로만 내려준다. 현재 만든 버킷: `story-audio`, `story-covers`, `soundscapes`, `voice-previews`(마이그레이션 20261003120000). `affirmation-audio`, `wall-photos`는 해당 기능 때 만든다.

## 7. 변경 절차

1. `supabase/migrations/<timestamp>_<name>.sql` 추가(기존 파일 수정 금지)
2. RLS 정책을 같은 파일에 작성
3. `pnpm db:reset` → `pnpm db:types`
4. 이 문서 갱신
