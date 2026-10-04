# 결정 기록

이미 내린 결정이다. 뒤집으려면 기존 항목을 지우지 말고 새 항목을 추가해 "대체: D-xx"라고 적는다.

| ID | 날짜 | 결정 | 이유 | 대안 |
| --- | --- | --- | --- | --- |
| D-01 | 2026-09-24 | 웹이 아니라 React Native(Expo)로 iOS·Android 동시 개발 | 핵심 습관(아침·잠들기 전 듣기)에 백그라운드 재생·잠금화면·푸시가 필요 | 모바일 웹 우선 후 앱 래핑 |
| D-02 | 2026-09-24 | 스토리·확언·검수 = Gemini | 팀 결정, 구조화 출력, 단가 | Claude, GPT |
| D-03 | 2026-09-24 | 음성·이미지·효과음 = ElevenLabs | 한국어 v3 품질, 한 공급자로 통합 | 이미지는 Gemini API 직접 호출 |
| D-04 | 2026-09-24 | 결제 = 스토어 인앱결제 + RevenueCat | 애플 한국 외부결제는 수수료 26%이고 StoreKit과 병행 불가 | 웹 결제 유도(추후 검토) |
| D-05 | 2026-09-24 | 백엔드 = Supabase + 얇은 Hono API + Inngest | 읽기는 RLS로 직접, 긴 생성 작업은 재시도 가능한 step으로 | Supabase Edge Functions만 사용 |
| D-06 | 2026-09-24 | 스토리 음성은 v3 단일 호출(최대 3,800자) | v3는 요청 스티칭 불가, 5,000자 한도 | Multilingual v2로 분할 생성 |
| D-07 | 2026-09-27 | 하단 탭 4개(홈·라이브러리·리추얼·마이), 이룸의 벽·감사일기는 마이 안 "나의 기록" | 지원서 UI 시안과 일치 | 5탭(벽 분리) |
| D-08 | 2026-09-27 | 퀴즈는 익명 로그인으로 시작, 페이월 직전에 소셜 계정 연결 | 첫 화면 이탈 최소화 | 로그인 먼저 |
| D-09 | 2026-09-27 | 사용자 얼굴 사진 기반 이미지는 MVP 제외 | 생체정보·개인정보 리스크 | 별도 동의 후 P2 |
| D-10 | 2026-10-02 | 세션 저장은 LargeSecureStore: 세션을 AES-256-CTR로 암호화해 AsyncStorage에 두고 키만 SecureStore에 둔다. 의존성 추가: `aes-js`, `expo-crypto`, `@react-native-async-storage/async-storage`, `react-native-url-polyfill` | SecureStore 값 하나에 약 2KB 제한이 있어 세션 JSON이 넘칠 수 있음. Supabase 공식 Expo 가이드 방식 | SecureStore 단독(크기 초과 위험) |
| D-11 | 2026-10-02 | pnpm `nodeLinker: hoisted` | RN·Expo 네이티브 모듈이 심볼릭 링크 구조에서 자주 깨짐 | pnpm 기본(isolated) |
| D-12 | 2026-10-02 | TypeScript 6.0 고정(7.0 미사용) | typescript-eslint 8.x가 TS 6.1 미만만 지원. Expo 57 템플릿도 6.0 | TS 7(네이티브 컴파일러) |
| D-13 | 2026-10-02 | NativeWind v4 + Tailwind CSS 3.4 | NativeWind v5는 RC 단계. v4는 Tailwind 3.x 필요 | NativeWind v5 + Tailwind 4 |
| D-14 | 2026-10-02 | API의 JWT 검증은 Supabase JWKS(비대칭 키)가 기본, `SUPABASE_JWT_SECRET`이 있으면 HS256 | 새 프로젝트는 비대칭 서명 키 사용. 레거시 프로젝트도 지원 | Supabase `auth.getUser` 호출(요청마다 네트워크) |
| D-15 | 2026-10-02 | `PROVIDER_MODE=mock`: 어댑터가 외부 AI 대신 고정 결과를 돌려줌. 프로덕션에서는 금지 | 유료 키 없이 파이프라인·플레이어 개발, 테스트 비용 0 | 처음부터 실제 API 사용 |
| D-16 | 2026-10-02 | 환경별 번들 ID: `com.o3c.eloria.dev`, `.preview`, `com.o3c.eloria`(Q-05 확정 전 가칭) | 개발·스테이징·프로덕션 앱을 한 기기에 같이 설치 | 단일 번들 ID |
| D-17 | 2026-10-02 | expo-audio 마이크 권한 비활성(`microphonePermission: false`, `recordAudioAndroid: false`) | 녹음 기능 없음. 불필요한 권한은 심사·사용자 신뢰에 불리 | 기본값(권한 요청) |
| D-18 | 2026-10-02 | Supabase advisor의 `auth_allow_anonymous_sign_ins` 경고는 수용한다. 사용자 테이블 정책은 익명 사용자(authenticated 역할)도 본인 행만 접근 | D-08(익명으로 퀴즈 시작). staging에서 익명 사용자의 타인 행 조회·쓰기 거부를 확인. 생성 같은 비용 작업은 서버가 `is_anonymous`·한도로 판단 | 정책에 `is_anonymous = false` 조건 추가(퀴즈 저장 불가) |
| D-19 | 2026-10-03 | 카카오 로그인은 네이티브 SDK(`@react-native-seoul/kakao-login`) → ID 토큰 → `supabase.auth.linkIdentity({ provider: 'kakao', token })`로 익명 계정에 연결. 의존성 추가: `@react-native-seoul/kakao-login`, `expo-build-properties`(카카오 Maven 저장소) | 카카오톡 앱 로그인 UX, 익명 계정의 퀴즈 데이터 유지(M1 "익명→소셜 연결 방식" 확인 항목) | 브라우저 OAuth(`linkIdentity` + `expo-web-browser`) |
| D-20 | 2026-10-03 | Supabase 카카오 provider의 client_id에 `REST API 키,네이티브 앱 키`를 함께 넣는다 | 브라우저 OAuth는 첫 값(REST 키)을 쓰고, 네이티브 SDK ID 토큰의 audience는 네이티브 앱 키다. authorize 리디렉트가 REST 키만 쓰는 것으로 목록 처리를 확인. 2026-10-03 Android 실기기에서 네이티브 키 audience ID 토큰으로 연결 성공 | ID 토큰 대신 브라우저 OAuth만 사용 |
| D-21 | 2026-10-03 | 카카오 계정이 이미 다른 Eloria 계정에 연결돼 있으면(`identity_already_exists`) 그 계정으로 로그인하고 익명 계정 데이터는 옮기지 않는다(임시) | 재설치·기기 변경 사용자의 복귀 경로가 우선. 데이터 이관은 Q-07 | 연결 거부 후 안내만 |
| D-22 | 2026-10-03 | Supabase Auth 이메일 확인(`enable_confirmations`)을 끈다 | 이메일 로그인이 없는 앱(익명·소셜만). 켜 두면 소셜 계정 연결 때 확인 메일을 보내 기본 SMTP 발송 한도(429 `over_email_send_rate_limit`)에 걸림 | 커스텀 SMTP 설정 |
| D-23 | 2026-10-03 | 카카오 `account_email`을 필수 동의로 받는다(개인 개발자 비즈 앱 전환) | Supabase는 익명 계정에 이메일 없는 ID 토큰을 연결하면 `email_address_invalid`로 거부함(staging 실기기 확인). 이메일이 있어야 D-19 방식(익명 계정에 연결, 데이터 유지)이 동작 | 이메일 없이 새 계정 가입 후 익명 데이터를 서버에서 이관 |
| D-24 | 2026-10-03 | 하단 탭은 JS 탭(`expo-router/tabs`)과 직접 그린 탭 바. 아이콘은 `expo-symbols`(iOS SF Symbols, Android Material Symbols) | 미니 플레이어를 iOS·Android 모두 탭 위에 고정해야 함. NativeTabs의 BottomAccessory는 iOS 26 전용 | NativeTabs(`expo-router/unstable-native-tabs`) |
| D-25 | 2026-10-03 | 온보딩 완료(`profiles.onboarding_completed_at`)는 앱이 RLS 본인 수정으로 직접 기록. 홈 탭 레이아웃이 이 값으로 퀴즈 리디렉트 | 권한·원가와 무관한 사용자 자신의 상태. 퀴즈 답변의 프로필 반영은 `POST /v1/quiz/complete`(API.md)에서 따로 함 | 서버 API로만 기록 |
| D-26 | 2026-10-03 | 생성 요청 분당 한도(3회)는 API 프로세스 메모리의 사용자별 시간창으로 센다 | 지금은 단일 인스턴스 개발 단계. 비용 한도는 `generation_quota`(DB)로 따로 판단하므로 이 제한은 남용 방지용 | Upstash 등 외부 저장소(Vercel 다중 인스턴스 배포 시 재검토) |
| D-27 | 2026-10-03 | 음성 캐시가 적중하면 기존 파일을 새 스토리의 사용자 폴더로 복사(storage copy)하고 TTS는 부르지 않는다 | 비공개 버킷은 본인 폴더만 읽는 RLS(DATA_MODEL 6절)를 유지하면서 재생성 비용을 없앰 | 다른 사용자 경로를 서명 URL로 공유 |
| D-28 | 2026-10-03 | 생성 파이프라인 본체는 Inngest와 분리한 함수(`runStoryPipeline(deps, event, step)`), 외부 호출은 `packages/providers` 인터페이스 뒤에 둔다 | 저장소·어댑터를 가짜로 바꿔 단계·상태 전이·검수 분기를 단위 테스트, mock/live 교체가 쉬움 | Inngest 함수 안에 직접 구현 |
| D-29 | 2026-10-03 | expo-audio 57.0.5에 pnpm 패치(`patches/expo-audio@57.0.5.patch`)로 Android ExoPlayer `setHandleAudioBecomingNoisy(true)`를 켠다 | Android에서 이어폰·블루투스가 끊겨도 재생이 계속됨(iOS는 expo-audio가 이미 정지). 한 줄 변경이라 별도 네이티브 모듈보다 단순. expo-audio를 올릴 때 패치를 다시 확인하거나 업스트림 반영 시 제거 | 이어폰 분리 브로드캐스트를 받는 로컬 Expo 모듈 |
| D-30 | 2026-10-03 | mock TTS는 2초마다 차임이 울리는 WAV(16kHz 모노)를 만든다(모델 이름 `mock-chime`) | 무음 MP3로는 재생·백그라운드·이어폰 분리를 귀로 확인할 수 없음. 실제 음성은 MP3(AI_PIPELINE 7절)이고 저장 경로 확장자는 mime을 따른다 | 사전 녹음 샘플 파일을 저장소에 포함 |
| D-31 | 2026-10-04 | 스토리 삭제는 API(`DELETE /v1/stories/:id`)로만, 생성이 끝난 것만 허용. 파일 → 행 순서로 지우고 빈 꿈도 지운다. 생성 기록은 남기고 한도는 기록 행으로 센다 | 생성 중 삭제 시 파이프라인이 올린 파일이 주인 없이 남음. 삭제로 한도를 되돌리는 허점 방지. 꿈 원문은 개인 데이터라 스토리가 없으면 남기지 않음 | 앱이 RLS로 직접 삭제(파일이 남음) |
| D-32 | 2026-10-04 | Android의 채워진 하트는 View로 그린다(`FilledHeart`) | expo-symbols Android는 Material Symbols Outlined 글꼴이라 채워진 아이콘(FILL)이 없음. 새 네이티브 의존성·빌드 없이 해결 | react-native-svg 아이콘(새 빌드 필요) |
| D-33 | 2026-10-04 | 푸시는 Expo 푸시 서비스(FCM V1·APNs 대행)로 보내고, 생성 완료 푸시는 파이프라인 마지막 `notify` step에서 실패를 삼킨다. 앱이 앞에 있으면 배너를 숨기고, 알림 탭은 탭 레이아웃(온보딩 통과 후)에서 처리한다. `google-services.json`은 레포에 두지 않고 EAS file 환경 변수 `GOOGLE_SERVICES_JSON`으로 넣는다 | 스택(expo-notifications)과 맞고 FCM·APNs 자격 증명을 EAS가 관리. 푸시 실패로 `onFailure`가 ready 스토리를 실패로 바꾸면 안 됨. 진행 화면이 이미 Realtime으로 바뀌므로 앞에서는 중복 안내 | FCM·APNs 직접 연동, Supabase Edge Function에서 발송 |
| D-34 | 2026-10-04 | 리추얼은 사용자 스토리와 같은 파이프라인(`runStoryPipeline`)으로 만든다. 소유자 없는 컨텍스트(`userId: null`, 테마만, 이름·사람·퀴즈 없음)로 돌리고 파일은 `library/`, 기록은 `kind = library`. 테마 카탈로그는 코드(`library/catalog.ts`)에 두고 `library_items.seed_key`로 중복 생성을 막는다. 무료 범위는 `LIBRARY_ACCESS`(카테고리당 1개, Q-04)로 서버가 판단하되 결제(M5) 전에는 페이월을 끈다 | 검수·재작성·음성 캐시·원가 기록을 그대로 재사용. 시드 재실행이 안전. 페이월 없이도 리추얼 재생을 끝까지 시험 | 별도 시드 스크립트, 리추얼 오디오를 public 버킷에 |
| D-35 | 2026-10-04 | 배경 사운드는 expo-audio 플레이어 2개로 동시 재생한다(대안 A·B 채택 안 함). 배경 플레이어는 반복 재생, 볼륨 3단계(0.15·0.3·0.5), 스토리 재생 상태를 따라 재생·정지. 선택은 `profiles.preferred_soundscape_id`에 저장. ElevenLabs 전까지 음원은 합성 루프(빗소리·파도·벽난로·백색소음, 22.05kHz WAV 20초) | Android 실기기(SM-A256N)에서 화면 꺼짐·백그라운드 7분 이상 두 트랙 유지, 잠금화면 일시정지 시 0.2초 안에 같이 멈춤(`dumpsys audio` 기록). expo-audio는 오디오 포커스를 앱 단위로 하나만 잡아 서로 끊지 않음. 볼륨 슬라이더는 새 네이티브 의존성이 필요해 단계로 대체 | 대안 A 서버 사전 믹스(사운드×볼륨마다 파일 필요), 대안 B react-native-track-player(전환 비용). iOS 확인 후 다시 판단 |

## 확인 후 기록할 항목

- ~~익명 계정 → 소셜 계정 연결 방식(M1)~~ → D-19~D-23
- ~~배경 사운드 2트랙 잠금화면 동작 결과와 채택한 방식(M2)~~ → D-35 (iOS는 미확인)
- 확정한 Gemini 스토리 모델, 기본 보이스, `STORY_TARGET_CHARS`(M2)
- Vercel 함수 실행 시간으로 v3 음성 step이 충분한지(M1~M2)
