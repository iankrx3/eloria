# Eloria — 코딩 에이전트 가이드

Eloria는 한 줄의 꿈을 "이미 그 삶을 사는 나"의 오디오 스토리로 바꿔 매일 듣게 하는 20~30대 여성 대상 manifestation 앱이다.
Expo(React Native)로 iOS·Android를 동시에 만든다. 이 파일은 모든 작업 전에 읽는다.

## 먼저 읽을 문서

| 문서 | 언제 |
| --- | --- |
| `docs/PRD.md` | 기능·화면·카피를 만들 때 |
| `docs/ARCHITECTURE.md` | 모듈 경계, 데이터 흐름, 보안 규칙 |
| `docs/DATA_MODEL.md` | 테이블·RLS·스토리지를 건드릴 때 |
| `docs/API.md` | 서버 라우트, 웹훅, Inngest 이벤트 |
| `docs/AI_PIPELINE.md` | Gemini 프롬프트, ElevenLabs 호출, 안전 검수, 원가 상한 |
| `docs/DESIGN.md` | UI 토큰, 화면 구조, 카피 톤 |
| `docs/ROADMAP.md` | 지금 할 일과 완료 기준(체크리스트) |
| `docs/DECISIONS.md` | 이미 내린 결정. 뒤집으려면 여기에 새 항목을 추가 |
| `docs/SETUP.md` | 계정, 환경 변수, 로컬 실행 |

작업 순서: `docs/ROADMAP.md`에서 현재 마일스톤의 첫 미완료 항목을 고른다 → 관련 문서를 읽는다 → 구현한다 → 완료 기준을 확인하고 체크한다.

## 스택 (확정)

- 앱: Expo SDK 57, React Native 0.86, TypeScript(strict), Expo Router, NativeWind, TanStack Query, Zustand
- 오디오: `expo-audio` / 파일: `expo-file-system` / 푸시: `expo-notifications`
- 결제: RevenueCat(`react-native-purchases`, `react-native-purchases-ui`)
- 백엔드: Supabase(Auth·Postgres·Storage·Realtime), API 서버 = Hono(Node, Vercel 배포), 작업 큐 = Inngest
- AI: Gemini(`@google/genai`) = 스토리·확언·검수 / ElevenLabs(`@elevenlabs/elevenlabs-js`) = 음성·이미지·효과음
- 모노레포: pnpm workspaces + Turborepo / 검증: zod / 테스트: Vitest(패키지·API), Jest + RNTL(앱) / 모니터링: Sentry, PostHog

새 의존성을 추가하기 전에 이 목록으로 되는지 먼저 본다. 추가했다면 `docs/DECISIONS.md`에 한 줄 남긴다.

## 레포 구조

```text
apps/mobile      Expo 앱 (app/ = 라우트, src/ = 로직)
apps/api         Hono 서버 (routes/, webhooks/, jobs/)
packages/shared  zod 스키마, 타입, 상수, Supabase 생성 타입
packages/prompts 프롬프트 템플릿과 버전
packages/providers  gemini, elevenlabs 어댑터 (앱은 import 금지)
supabase/        migrations/, seed.sql, config.toml
docs/            설계 문서
```

## 명령어

루트 `package.json`에 구현돼 있다. 스크립트를 바꾸면 이 표도 같이 고친다.

| 명령 | 역할 |
| --- | --- |
| `pnpm install` | 의존성 설치(pnpm 10+, 설치 스크립트 허용 목록은 `pnpm-workspace.yaml`의 `allowBuilds`) |
| `pnpm dev:mobile` | Expo 개발 서버(개발 빌드용, `--dev-client`) |
| `pnpm dev:api` | API 서버 로컬 실행 |
| `pnpm dev:inngest` | Inngest dev server |
| `pnpm db:start` / `pnpm db:reset` | 로컬 Supabase 시작 / 마이그레이션+시드 재적용 |
| `pnpm db:types` | 로컬 Supabase 타입을 `packages/shared/src/db.types.ts`로 생성 |
| `pnpm db:types:linked` | 연결된 원격 프로젝트(staging) 기준으로 같은 파일 생성 |
| `pnpm typecheck` / `pnpm lint` / `pnpm test` | 전체 검사(Turborepo) |
| `pnpm format` | Prettier 전체 적용 |
| `pnpm eval:story` | 프롬프트 평가 세트 실행(`docs/AI_PIPELINE.md` 5절, 실제 API 비용 발생) |
| `eas build --profile development --platform ios\|android` | 개발 빌드 |

작업을 끝내기 전에 `pnpm typecheck && pnpm lint && pnpm test`를 통과시킨다.

## 반드시 지킬 규칙

**보안·비밀키**
- Gemini·ElevenLabs·RevenueCat 비밀키·Supabase service role 키는 `apps/api`에만 둔다. 앱에는 `EXPO_PUBLIC_` 접두사가 붙은 공개 키(Supabase URL/anon key, RevenueCat public SDK key, PostHog key)만 들어간다.
- `apps/mobile`은 `packages/providers`를 import하지 않는다(ESLint 규칙으로 막는다).
- 앱은 오디오·이미지를 Supabase 서명 URL로만 받는다. 스토리지 버킷은 `soundscapes`, `voice-previews`를 제외하고 모두 private이다.

**데이터**
- 모든 테이블에 RLS를 켠다. 사용자 데이터는 `user_id = auth.uid()` 정책. 스키마 변경은 `supabase/migrations/`의 새 SQL 파일로만 한다. 기존 마이그레이션은 수정하지 않는다.
- 스키마를 바꾸면 `pnpm db:types`를 돌리고 `docs/DATA_MODEL.md`를 같이 고친다.
- 서버와 앱 사이의 모든 요청·응답·JSON 컬럼은 `packages/shared`의 zod 스키마로 검증한다.

**권한·원가**
- 구독 여부와 생성 한도는 서버에서만 판단한다(`subscriptions` 테이블 + `generation_quota`). 앱의 RevenueCat entitlement는 UI 표시용이다.
- 모든 Gemini·ElevenLabs 호출은 `generation_jobs`에 모델, 글자 수/토큰, 추정 비용을 기록한다. 상한 값은 `docs/AI_PIPELINE.md`의 설정값을 따른다.
- 같은 (텍스트 + 보이스 + 모델) 음성은 해시로 캐시하고 다시 만들지 않는다.

**콘텐츠 안전**
- 생성된 모든 스토리·확언은 안전 검수 단계를 통과해야 사용자에게 보인다.
- 앱 카피·스토어 문구·프롬프트 어디에도 "반드시 이루어진다" 같은 결과 보장, 투자·의료 조언을 넣지 않는다. 표현은 "경험·루틴·상상" 중심이다.
- Stella 등 경쟁 앱의 문구·UI·에셋을 복사하지 않는다. 기능 아이디어만 참고한다.

**앱**
- Expo Go로 검증하지 않는다. 결제·카카오 로그인·백그라운드 오디오는 개발 빌드에서만 동작한다. 네이티브 설정(app.config.ts, 플러그인)을 바꾸면 새 EAS 빌드가 필요하다고 작업 요약에 적는다.
- 오디오 기능을 바꾸면 iOS·Android 실기기 확인 항목(잠금화면, 백그라운드 5분 이상, 이어폰 분리)을 작업 요약에 적는다. 에이전트가 직접 확인할 수 없으면 "미확인"이라고 쓴다.
- UI 문자열은 `apps/mobile/src/i18n/ko.ts`에 둔다. 컴포넌트에 한국어를 하드코딩하지 않는다.
- 색·폰트·간격은 `docs/DESIGN.md`의 토큰(NativeWind 테마)만 쓴다.

## 코드 규칙

- TypeScript strict, `any` 금지(불가피하면 이유 주석). 서버 함수는 입력을 zod로 파싱한 뒤 사용.
- 파일·폴더 kebab-case, React 컴포넌트 PascalCase, DB 컬럼 snake_case, TS 필드 camelCase(변환은 `packages/shared`에서).
- 기능 단위 폴더(`src/features/<feature>/`)에 화면 로직·훅·컴포넌트를 모은다.
- 외부 API 호출은 `packages/providers`의 어댑터를 통해서만 한다. 어댑터는 재시도·타임아웃·비용 계산을 포함한다.
- 커밋은 Conventional Commits(`feat:`, `fix:`, `chore:` …), 한 커밋 한 목적.

## 모르면

- 설계 문서에 없는 제품 결정(가격, 카피, 무료 한도 등)은 임의로 정하지 말고 `docs/ROADMAP.md`의 "열린 질문"에 추가하고 합리적인 기본값으로 진행한다. 기본값은 설정 상수로 두어 쉽게 바꾸게 한다.
- 외부 SDK·API 사용법은 기억에 의존하지 말고 공식 문서를 확인한다. 특히 Expo SDK 버전별 API, ElevenLabs 모델 ID, Gemini 모델 ID는 자주 바뀐다.
