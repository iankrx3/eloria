# API

API 서버(`apps/api`, Hono)는 쓰기·생성·웹훅만 담당한다. 읽기는 앱이 Supabase에서 RLS로 직접 한다.

## 1. 공통

- Base path: `/v1`
- 인증: `Authorization: Bearer <Supabase access token>`. 서버는 토큰을 검증하고 `userId`를 토큰에서만 얻는다.
- 요청·응답 스키마: `packages/shared/src/api/*.ts`의 zod 스키마. 앱의 API 클라이언트도 같은 스키마로 응답을 파싱한다.
- 에러 형식:

```json
{ "error": { "code": "QUOTA_EXCEEDED", "message": "사람이 읽을 수 있는 설명", "details": {} } }
```

| code | HTTP | 의미 |
| --- | --- | --- |
| UNAUTHORIZED | 401 | 토큰 없음·만료 |
| FORBIDDEN | 403 | 구독 필요 기능 |
| QUOTA_EXCEEDED | 429 | 생성 한도 초과 |
| RATE_LIMITED | 429 | 분당 요청 초과 |
| VALIDATION_FAILED | 400 | zod 검증 실패 |
| NOT_FOUND | 404 | |
| CONFLICT | 409 | 지금 상태에서는 할 수 없음(예: 생성 중인 스토리 삭제) |
| INTERNAL | 500 | |

## 2. 엔드포인트

| 메서드·경로 | 용도 | 요청 | 응답 |
| --- | --- | --- | --- |
| POST `/v1/quiz/answers` | 퀴즈 답변 저장(upsert). 답은 문항별 형식(`quizAnswerSchemas`)으로 검증 | `{ questionKey, answer }` | `204` |
| POST `/v1/quiz/complete` | 퀴즈 완료, 프로필 반영(이름·연애 상태·톤·듣는 시간·알림 기본값, 소중한 사람은 퀴즈 답으로 교체) | — | `{ profile }` |
| POST `/v1/manifests` | 꿈 등록 + 첫 스토리 생성 | `{ text, category?, voiceKey?, tone? }` | `202 { desireId, storyId }` |
| POST `/v1/desires/:id/stories` | 같은 꿈의 새 버전 | `{ tone? }` | `202 { storyId }` |
| POST `/v1/stories/:id/revise` | 스토리 수정 | `{ request }`(≤200자) | `202 { storyId }` |
| POST `/v1/stories/:id/retry` | 실패한 단계 재시도 | — | `202` |
| DELETE `/v1/stories/:id` | 스토리 삭제(본인 것, 생성이 끝난 것만). 음성·표지 파일과 행을 지우고, 남은 스토리가 없는 꿈도 지운다. 생성 기록은 남긴다 | — | `204`, 생성 중이면 `409 CONFLICT` |
| GET `/v1/stories/:id/media` | 서명 URL 발급 | — | `{ audioUrl, coverUrl, expiresAt }` |
| POST `/v1/daily` | 오늘의 순간 즉시 생성(없을 때) | — | `200 { storyId }` 또는 `202` |
| POST `/v1/affirmations/:id/audio` | 확언 음성(캐시 우선) | `{ voiceKey? }` | `{ audioUrl }` |
| POST `/v1/push-tokens` | 푸시 토큰 등록 | `{ token, platform }` | `204` |
| POST `/v1/promo/redeem` | 크리에이터 코드 | `{ code }` | `{ grant }` |
| POST `/v1/account/delete` | 계정 삭제 요청 | — | `202` |

`GET /v1/stories/:id/media`는 Supabase 서명 URL을 앱이 직접 만들 수 없는 경로(library, 해시 캐시)에만 쓴다. 본인 경로 파일은 앱이 `createSignedUrl`을 직접 호출해도 된다.

## 3. 웹훅

| 경로 | 발신 | 검증 | 처리 |
| --- | --- | --- | --- |
| POST `/v1/webhooks/revenuecat` | RevenueCat | `Authorization` 헤더 공유 시크릿 | `webhook_events`에 event_id 저장(중복 무시) → `subscriptions` upsert |
| POST `/v1/webhooks/elevenlabs` | ElevenLabs(이미지 생성 완료) | 서명 헤더 | Inngest `story/cover.completed` 발행. 결과 URL은 약 1시간 만료이므로 즉시 다운로드 step 실행 |
| `/api/inngest` | Inngest | Inngest 서명 키 | 함수 서빙 |

## 4. Inngest 이벤트와 함수

| 이벤트 | 함수 | 동시성·재시도 |
| --- | --- | --- |
| `story/generate.requested` { storyId } | `generateStory`: plan → write → review → (tts ‖ cover 요청) | 사용자당 동시 2, 전체 동시성은 ElevenLabs 플랜 한도 이하, step별 재시도 3 |
| `story/revise.requested` { storyId } | `reviseStory`: write(원본+요청) → review → tts, 표지 재사용 | 위와 동일 |
| `story/cover.completed` { storyId, generationId } | `saveCover`: 다운로드 → storage → status 갱신 | 재시도 5 |
| `daily/tick` (cron `0 * * * *`) | `scheduleDaily`: 대상 사용자 조회 → `daily/generate.requested` fan-out | — |
| `daily/generate.requested` { userId } | `generateDaily` → 완료 푸시 | 사용자당 하루 1회(idempotency key = userId+date) |
| `affirmation/audio.requested` { affirmationId, voiceKey } | `renderAffirmationAudio` | 해시 캐시 확인 후 생성 |
| `user/delete.requested` { userId } | `deleteUser`: 스토리지 → DB → auth 사용자 삭제 | 재시도 5 |
| `library/seed.requested` (수동) | `seedLibrary`: 카테고리별 콘텐츠 생성 | 관리자 전용 |

모든 함수는 시작·종료·실패를 `generation_jobs`에 기록한다.
