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
- [ ] Apple·Kakao·Google 로그인과 익명 계정 연결. 방식을 `DECISIONS.md`에 기록 — 카카오 완료(D-19~D-23): Android 실기기에서 익명 계정에 연결되고 같은 사용자 ID·프로필이 유지됨을 확인(2026-10-03). iOS 미확인. Google은 키 대기, Apple은 개발자 계정 필요
- [x] API 서버 JWT 검증 미들웨어, 에러 형식, `/v1/health`
- [x] Inngest 연결, 빈 함수 1개 실행 확인 — dev server에서 `system/ping` 실행 Completed(2026-10-03)
- [x] GitHub Actions CI: typecheck, lint, test
- **완료 기준**: iOS·Android 개발 빌드에서 익명 → 소셜 계정 연결까지 되고 CI가 녹색

## M2. 생성 루프와 플레이어 (2~3주차)

- [x] 마이그레이션: stories, story_assets, voices, soundscapes, generation_jobs, 스토리지 버킷과 정책 — staging 적용, Realtime(stories), 서버 전용 `generation_quota` 뷰
- [ ] `packages/providers`: Gemini(구조화 출력), ElevenLabs TTS, 비용 계산, 재시도·타임아웃 — 어댑터 인터페이스(StoryModel·TtsProvider)와 mock 어댑터 완료. Gemini·ElevenLabs live 어댑터는 유료 키 후
- [ ] `packages/prompts`: scene-plan v1, story v1, safety v1 + 평가 세트 30개 + `pnpm eval:story` — 프롬프트 3종, 평가 세트 30개(위험 5개), 스크립트 점검(`checkScript`), 실행기(`--mock`으로 동작 확인, D-36)까지 완료. live Gemini 어댑터를 붙여 실제로 돌리고 위험 입력 5개 통과·사람 채점을 확인하면 체크
- [x] `POST /v1/manifests`, Inngest `generateStory`(plan → write → review → tts), 상태 전이와 `generation_jobs` 기록 — mock 어댑터로 staging에서 queued → ready까지 확인(음성 업로드·서명 URL·generation_jobs 기록). 무료·구독 한도 검사는 M5
- [x] 앱 내비게이션 뼈대: 온보딩 그룹(퀴즈·첫 꿈·계정 연결·페이월 자리), 하단 탭 4개(D-24), 온보딩 미완료 시 퀴즈로 리디렉트(D-25)
- [x] 퀴즈 화면 12문항(데이터 기반, 2026-11-11 퀴즈 v2 13문항으로 교체 D-39), 답변 자동 저장·이어하기 — `POST /v1/quiz/answers|complete`, staging에서 저장·완료·people 반영 확인. 보이스 미리듣기는 voices 준비 후(Q-08)
- [x] 홈 꿈 입력, 생성 진행 화면(Realtime 구독, 텍스트 먼저 읽기) — 홈·온보딩 공용 꿈 입력창, 오브 애니메이션(동작 줄이기 대응), 전체 스토리 보기, 위기 신호 시 상담 전화 안내. Android 실기기 확인(2026-10-03)
- [ ] 플레이어: 재생·10초 이동·진행 바·반복·전체 스토리 보기, 잠금화면 메타데이터, 백그라운드 재생 — 앱 전역 플레이어·풀 플레이어·미니 플레이어·잠금화면 메타데이터 구현, Android 실기기 재생 확인(mock 차임). **미해결: Android 이어폰 분리 시 정지가 패치(D-29) 포함 빌드(3eece51)에서도 동작하지 않음** — EAS 빌드 로그에서 패치 적용 여부, 잠금화면 미디어 서비스 경로의 ExoPlayer 설정을 확인할 것. Android 잠금화면(화면 꺼짐)·백그라운드 7분 이상 재생 확인(2026-10-04, 배경 사운드와 함께). iOS는 미확인
- [x] 배경 사운드 2트랙 믹서 + 실기기 검증 결과를 `DECISIONS.md`에 기록(대안 A/B 포함) — expo-audio 플레이어 2개, Android 확인(D-35). 음원은 합성 루프 4종(mock), iOS는 미확인
- [ ] [사람] 모델 3종 × 보이스 3~5종 블라인드 청취, 한국어 5분 분량 글자 수 실측 → `limits.ts` 갱신
- **완료 기준**: 꿈 한 줄 입력 → 90초 안에 텍스트, 이어서 음성이 도착하고, 잠금화면에서 끝까지 재생

## 디자인 리뉴얼: ARIN (2026-11-11, D-38~D-41)

- [x] 브랜드·토큰·글꼴·아이콘(react-native-svg)·사진 번들, 앱 아이콘·스플래시 교체, 표시 이름 ARIN
- [x] 퀴즈 v2 13문항 + 전환 화면 + 시네마틱 4장 + 로그인(S01) + 홈 첫 진입 페이월. shared·API·프롬프트 사용자 정보 반영(D-39)
- [x] 홈(H01), 생성 진행(H04·H06), 플레이어(H07), 전체 이야기(H08), 페이월(H09) 미리보기, 라이브러리(L01·L04), 저장한 이야기, 확언 탭 준비 중, 마이페이지(P01·P03)
- [ ] **새 개발 빌드 필요**(react-native-svg 네이티브 모듈, 앱 이름·아이콘·스플래시 변경): 커밋 후 `cd apps/mobile && eas build --profile development --platform android`로 빌드하고 실기기 확인 — 퀴즈 전체 흐름(조건부 문항 건너뛰기), 시네마틱 → 로그인 → 홈 → 페이월, 글꼴·그라디언트 표시, 플레이어 잠금화면·백그라운드 5분·이어폰 분리. iOS는 Apple 계정 후
- [x] 키보드 회피(keyboard-controller)·햅틱(expo-haptics, 설정에서 끄기)·사진 위 유리 흐림(expo-blur), Figma 세부 일치(D-42·D-43)
- [x] Figma 기능 실제 구현(D-44): 목소리 시트(H10, 미리듣기는 ElevenLabs 후 Q-08), 연속 기록(H11), 21일 챌린지(H12), 목표 수정(H13), 설정(P02, 구독 항목은 결제 후), 약관 문서 화면(전문은 M0), 회원 탈퇴(P04, `POST /v1/account/delete`), 마이페이지 설정 버튼·실제 숫자(연속 기록·들은 이야기·저장한 확언)·사는 곳·하는 일·보관함(감사 일기, 지난 이야기 30일), 홈 보이스·연속 기록 칩·비전 사진·챌린지 알림·카드
- [ ] **새 개발 빌드 필요**(D-42 네이티브 의존성, expo-image-picker·expo-media-library 권한 문구): 실기기 확인 — 키보드(퀴즈 이름·나이·서술형·사람 칩, 마이 시트, 홈 입력, 감사 일기), 햅틱(설정에서 끄면 멈추는지), 비전 사진 고르기, 챌린지 미션 완료, 탈퇴 후 처음 화면, 사진이 비어 보이던 문제(adb 캡처로 원인 확인)
- [x] 마이페이지 Figma P01 순서·사람 수정·라이프스타일 ↻ AI 추천(`POST /v1/profile/lifestyle-suggestions`)·⊕ 빠른 추가·최근 들은 것(D-46)
- [x] 라이브러리 Figma L01 구조·검색, 전체 보기 정렬(L04), 소원 테마 묶음·이어 듣기(L06), 주파수 10분 반복 음원, staging 시드 26편+주파수 3편(mock 글, D-47)
- [ ] ElevenLabs 연결 후 라이브러리 전체(이전 20편 포함)를 live 글·실제 음성으로 다시 만들기, 끌어당김 노래(음악 모델)
- [ ] 아직 남은 Figma 화면: 비전 고르기(H05)
- [x] Gemini live 어댑터(구조화 출력·재시도·타임아웃·비용 기록), 글/음성 모드 분리, 하루 호출 상한, `eval:story --live` 필수(D-45)
- [x] 오늘의 확언 A01~A05: 서버 생성·검수·기본 확언, 카드 스와이프(8° 기울기), 저장·저장 목록, 공유 이미지(9:16)·이미지 저장·문구 복사, 10장 완료 → 연속 기록. 목소리로 듣기는 ElevenLabs 후
- [ ] 홈 다음 이야기 카운트다운(데일리 M5와 함께)

## M3. 콘텐츠와 테스트 배포 (4주차)

- [ ] ElevenLabs Image 표지(웹훅 → 즉시 다운로드), 실패 시 카테고리 기본 이미지
- [ ] 보이스 선택·미리듣기, 배경 사운드 시드 스크립트 — 시드 스크립트는 있음(`pnpm --filter @eloria/api seed:soundscapes`, 지금은 합성 음원). ElevenLabs 음원 6~8종으로 교체 남음
- [x] Rituals: library_items 시드(카테고리당 5개), 리추얼 탭 화면 — Android 실기기 확인(2026-10-04). staging 시드 25편은 mock(템플릿 글·차임)이라 실제 AI 연결 후 지우고 다시 시드. 확언 스와이프는 M4
- [x] 라이브러리 탭(내 스토리, 좋아요), 마이 탭(Personal 편집) — 라이브러리(꿈별 목록·좋아요·삭제), 마이(이름·톤·소중한 사람·좋아하는 것/싫어하는 것, 다음 생성에 반영). 이름 발음·알림 시간·보이스 기본값은 이후
- [ ] PostHog 퍼널 이벤트 전부(PRD 8.1), Sentry(꿈 텍스트 제거)
- [x] 푸시 토큰 등록, 생성 완료 푸시 — Android 실기기 수신 확인(2026-10-04, FCM V1). iOS(APNs)는 Apple 계정 생긴 뒤
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

- [ ] 저장 확언 연속 재생(확언 음성, ElevenLabs 후). 스와이프·저장은 D-45에서 완료
- [ ] 이룸의 벽(사진 포함). 감사 일기·연속 기록은 D-44에서 완료
- [ ] 플레이리스트, 공유 카드 이미지
- [ ] 이름 발음 교정(발음 사전)

## M8. 차별화 (12주차~)

- [ ] 내 목소리로 듣기(즉시 클론, 본인 확인)
- [ ] AI 코치

## 열린 질문

| ID | 질문 | 임시 기본값 |
| --- | --- | --- |
| Q-01 | 연간 구독 가격과 무료 체험 기간 | 월 9,900원. Figma 페이월 예시는 연간 59,000원·7일 무료 체험(`apps/mobile/src/features/paywall/plans.ts`에 미리보기 값), RevenueCat 설정 후 결정 |
| Q-02 | 스토리 길이 5분 유지 vs 3분으로 단축(원가) | `STORY_TARGET_CHARS` 3,200, 실측 후 결정 |
| Q-03 | 첫 스토리를 결제 전에 들려줄지 | A/B 플래그, 기본 = 들려줌 |
| Q-04 | 무료 사용자에게 공개할 Library 범위 | 카테고리당 1개 |
| Q-05 | 번들 ID·패키지명 | `com.o3c.eloria` (가칭) |
| Q-06 | 데일리 음성 모델(v3 vs Flash) | 블라인드 청취 후 결정, 기본 v3 |
| Q-07 | 이미 계정이 있는 사용자가 새 기기에서 익명으로 퀴즈를 한 뒤 로그인하면, 익명 데이터를 기존 계정으로 옮길지 | 옮기지 않고 기존 계정으로 로그인(D-21). 남은 익명 계정은 추후 정리 작업으로 삭제 |
| Q-08 | 퀴즈 보이스 3종의 이름·실제 보이스 | 자리 키 `voice_a|b|c`와 "차분한·따뜻한·또렷한 목소리". 블라인드 청취(M2 [사람]) 후 voices 테이블과 연결 |
| Q-09 | 듣는 시간별 알림 기본 시각 | 아침 07:30, 출퇴근 08:30, 잠들기 전 22:30(`packages/shared/src/config/defaults.ts`) |
| Q-10 | 리추얼 25편의 테마 문구와 카테고리 이름(머니·사랑·커리어·자신감·명상) | `apps/api/src/library/catalog.ts`의 기본 테마, 카테고리 이름은 `ko.rituals.categories` |
| Q-11 | 퀴즈 "상상 속 아침"(Q12)의 "지금 우리 집 창밖"이 보기인지 버튼 문구인지 | 9번째 보기(한 줄 전체 칸)로 두고 아래에 "계속하기" 버튼을 따로 둠 |
| ~~Q-12~~ | 마이페이지 "사는 곳"·"하는 일"을 어디에 저장할지 | → profiles `location`·`occupation`(D-44) |
| Q-13 | 퀴즈에서 빠진 톤·듣는 시간·보이스·알림 시각을 어디서 받을지 | 톤은 서버 기본값(calm), 알림 권한은 시네마틱 마지막에 요청, 나머지는 설정 화면(P02)에서 |
| Q-14 | 21일 챌린지 미션 21개 문구, 보이스 4명(하린·서아·유나·지호)의 이름·설명 | 마이그레이션 20261111140000의 임시 문구. 바꿀 때는 새 마이그레이션으로 update |
| Q-15 | 지난 이야기 기준(30일)과 마이 숫자 3개(연속 기록·들은 이야기·저장한 확언)가 맞는지 | 30일, Figma P01 순서 |
| Q-16 | 확언 공유: 인스타 스토리 직접 공유(Meta 앱 ID 필요)와 "링크 복사"용 웹 링크를 만들지, 기본 확언 10개 문구가 괜찮은지 | 시스템 공유 창, "문구 복사", `packages/prompts/src/affirmation/v1.ts`의 임시 문구 |
