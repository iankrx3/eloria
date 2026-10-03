# 로드맵과 작업 목록

공개 출시는 8주차가 목표다. 에이전트는 현재 마일스톤의 첫 미완료 항목부터 진행하고, 완료 기준을 확인한 뒤 체크한다. 사람이 해야 하는 일은 `[사람]`으로 표시했다.

## M0. 준비 (0주차, 병행)

- [ ] [사람] Apple Developer Program, Google Play Console 계정 개설. Play 개인 계정이면 프로덕션 출시 전 비공개 테스트 요건(테스터 수·기간)을 콘솔에서 확인
- [ ] [사람] Kakao Developers 앱 등록, 카카오 로그인 + OpenID Connect 활성화, iOS 번들 ID·Android 패키지명·키 해시 등록
- [ ] [사람] Supabase 프로젝트 2개(staging, production), RevenueCat 프로젝트, Inngest, Vercel, Sentry, PostHog 계정
- [ ] [사람] Gemini API 유료 키, ElevenLabs Creator 플랜(4주차에 Pro로 전환)
- [ ] [사람] 번들 ID 확정(열린 질문 Q-05), 개인정보 처리방침·이용약관 초안

## M1. 스캐폴딩과 인증 (1주차)

- [x] pnpm + Turborepo 모노레포, `apps/mobile`(create-expo-app, SDK 57, Expo Router, TypeScript strict), `apps/api`(Hono), `packages/shared|prompts|providers`
- [x] ESLint·Prettier, `apps/mobile`에서 `packages/providers` import 금지 규칙, `pnpm typecheck|lint|test` 동작 (앱 컴포넌트의 한국어 하드코딩 금지 규칙도 추가)
- [x] CLAUDE.md의 명령어 표 스크립트 전부 구현 (`db:*`는 Docker 설치 후 실행 확인 필요, `eval:story`는 M2까지 안내 메시지만 출력)
- [x] `eas.json` 프로필(development, preview, production), `app.config.ts`(환경별 번들 ID, expo-audio 백그라운드 플러그인, 알림, 카카오 플러그인)
- [x] 로컬 Supabase + 첫 마이그레이션: profiles, quiz_answers, people, desires, consents, app_config + RLS + `pnpm db:types` — staging에 적용하고 `pnpm db:types:linked`로 타입 생성. RLS(본인 행만, 비로그인 차단, 타인 user_id 쓰기 거부)를 staging에서 확인. 로컬 Docker 환경은 아직 없음
- [x] 앱 Supabase 클라이언트(secure-store 세션), 익명 로그인 — Android 개발 빌드 실기기에서 익명 세션·API 연결 확인(2026-10-02). iOS 미확인
- [ ] Apple·Kakao·Google 로그인과 익명 계정 연결. 방식을 `DECISIONS.md`에 기록 — 카카오 구현(D-19~D-21), 새 개발 빌드에서 실기기 확인 필요. Google은 키 대기, Apple은 개발자 계정 필요
- [x] API 서버 JWT 검증 미들웨어, 에러 형식, `/v1/health`
- [ ] Inngest 연결, 빈 함수 1개 실행 확인 — `system-ping` 함수 서빙 확인, dev server에서 실행은 미확인
- [x] GitHub Actions CI: typecheck, lint, test
- **완료 기준**: iOS·Android 개발 빌드에서 익명 → 소셜 계정 연결까지 되고 CI가 녹색

## M2. 생성 루프와 플레이어 (2~3주차)

- [ ] 마이그레이션: stories, story_assets, voices, soundscapes, generation_jobs, 스토리지 버킷과 정책
- [ ] `packages/providers`: Gemini(구조화 출력), ElevenLabs TTS, 비용 계산, 재시도·타임아웃
- [ ] `packages/prompts`: scene-plan v1, story v1, safety v1 + 평가 세트 30개 + `pnpm eval:story`
- [ ] `POST /v1/manifests`, Inngest `generateStory`(plan → write → review → tts), 상태 전이와 `generation_jobs` 기록
- [ ] 퀴즈 화면 12문항(데이터 기반), 답변 자동 저장·이어하기
- [ ] 홈 꿈 입력, 생성 진행 화면(Realtime 구독, 텍스트 먼저 읽기)
- [ ] 플레이어: 재생·10초 이동·진행 바·반복·전체 스토리 보기, 잠금화면 메타데이터, 백그라운드 재생
- [ ] 배경 사운드 2트랙 믹서 + 실기기 검증 결과를 `DECISIONS.md`에 기록(대안 A/B 포함)
- [ ] [사람] 모델 3종 × 보이스 3~5종 블라인드 청취, 한국어 5분 분량 글자 수 실측 → `limits.ts` 갱신
- **완료 기준**: 꿈 한 줄 입력 → 90초 안에 텍스트, 이어서 음성이 도착하고, 잠금화면에서 끝까지 재생

## M3. 콘텐츠와 테스트 배포 (4주차)

- [ ] ElevenLabs Image 표지(웹훅 → 즉시 다운로드), 실패 시 카테고리 기본 이미지
- [ ] 보이스 선택·미리듣기, 배경 사운드 시드 스크립트
- [ ] Rituals: library_items 시드(카테고리당 5개), 리추얼 탭 화면
- [ ] 라이브러리 탭(내 스토리, 좋아요), 마이 탭(Personal 편집)
- [ ] PostHog 퍼널 이벤트 전부(PRD 8.1), Sentry(꿈 텍스트 제거)
- [ ] 푸시 토큰 등록, 생성 완료 푸시
- [ ] TestFlight·Play 내부 테스트 배포
- [ ] [사람] 수수료·TTS 원가로 9,900원 구독 마진 재계산
- **완료 기준**: 외부 테스터가 설치 → 퀴즈 → 첫 스토리 → 리추얼 재생까지 막힘없이 완주

## M4. 검증 (5주차)

- [ ] 관리자용 지표 쿼리(SQL 뷰): 첫 스토리 완주율, D1 재생률, 사용자당 원가
- [ ] [사람] 초기 사용자 30명 모집(Play 비공개 테스트 요건과 겹치게), 인터뷰
- [ ] 첫 스토리 결제 전 제공 여부 A/B 플래그(Q-03)
- **완료 기준**: 세 지표가 대시보드에서 매일 갱신

## M5. 결제와 심사 (6~7주차)

- [ ] RevenueCat 상품(월간·연간), 페이월 화면(가격·갱신·해지 방법·복원), 웹훅 → subscriptions
- [ ] 생성 한도·권한 서버 검증(`generation_quota`)
- [ ] 계정 삭제(`/v1/account/delete` + Inngest), 설정 화면의 처리방침·약관 링크, AI 생성 콘텐츠 고지
- [ ] 스토리 수정(revise), 바뀐 문단 하이라이트
- [ ] 데일리: 크론, 사전 생성 대상 필터, 알림 시간 설정, 푸시 딥링크
- [ ] 오프라인 다운로드(즐겨찾기)
- [ ] [사람] 스토어 메타데이터·스크린샷·심사용 계정, 제출
- **완료 기준**: 샌드박스 구매 → 서버 권한 반영, 양 스토어 심사 통과

## M6. 출시 (8주차)

- [ ] 프로덕션 환경 전환, 크리에이터 코드(promo_codes)
- [ ] [사람] Meta 광고 소액 테스트, 크리에이터 시딩, 숏폼 훅 테스트
- **완료 기준**: 채널별 설치 → 구독 전환을 UTM으로 추적

## M7. Stella 기능 동등화 (9~11주차)

- [ ] 확언 스와이프 + 저장 확언 연속 재생
- [ ] 감사일기, 이룸의 벽(사진 포함), 스트릭
- [ ] 플레이리스트, 공유 카드 이미지
- [ ] 이름 발음 교정(발음 사전)

## M8. 차별화 (12주차~)

- [ ] 내 목소리로 듣기(즉시 클론, 본인 확인)
- [ ] AI 코치

## 열린 질문

| ID | 질문 | 임시 기본값 |
| --- | --- | --- |
| Q-01 | 연간 구독 가격과 무료 체험 기간 | 월 9,900원, 연간은 RevenueCat에서 설정 후 결정 |
| Q-02 | 스토리 길이 5분 유지 vs 3분으로 단축(원가) | `STORY_TARGET_CHARS` 3,200, 실측 후 결정 |
| Q-03 | 첫 스토리를 결제 전에 들려줄지 | A/B 플래그, 기본 = 들려줌 |
| Q-04 | 무료 사용자에게 공개할 Library 범위 | 카테고리당 1개 |
| Q-05 | 번들 ID·패키지명 | `com.o3c.eloria` (가칭) |
| Q-06 | 데일리 음성 모델(v3 vs Flash) | 블라인드 청취 후 결정, 기본 v3 |
| Q-07 | 이미 계정이 있는 사용자가 새 기기에서 익명으로 퀴즈를 한 뒤 로그인하면, 익명 데이터를 기존 계정으로 옮길지 | 옮기지 않고 기존 계정으로 로그인(D-21). 남은 익명 계정은 추후 정리 작업으로 삭제 |
