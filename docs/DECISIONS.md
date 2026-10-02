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

## 확인 후 기록할 항목

- 익명 계정 → 소셜 계정 연결 방식(M1)
- 배경 사운드 2트랙 잠금화면 동작 결과와 채택한 방식(M2)
- 확정한 Gemini 스토리 모델, 기본 보이스, `STORY_TARGET_CHARS`(M2)
- Vercel 함수 실행 시간으로 v3 음성 step이 충분한지(M1~M2)
