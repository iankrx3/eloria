# 개발 환경 설정

## 1. 필요한 도구

- Node.js 22 이상(24 LTS 확인됨), pnpm 10 이상(12에서 확인), Git
- Supabase CLI, EAS CLI(`npm i -g eas-cli`), Inngest CLI(`npx inngest-cli@latest dev`)
- **Docker Desktop**: 로컬 Supabase(`pnpm db:start`)에 필요. Windows는 WSL2 백엔드
- iOS 개발 빌드: macOS + Xcode(또는 EAS 클라우드 빌드) / Android: Android Studio 에뮬레이터 또는 실기기
- Windows 개발 PC: iOS 네이티브 빌드는 로컬에서 할 수 없으므로 Android 개발 빌드를 먼저 쓰고 iOS는 EAS 클라우드 빌드로 만든다
- 실기기 권장: 오디오·결제·푸시는 시뮬레이터에서 제대로 확인되지 않는다

## 2. 처음 실행

```bash
pnpm install
cp .env.example apps/api/.env
cp .env.example apps/mobile/.env   # EXPO_PUBLIC_ 값만 남긴다
pnpm db:start && pnpm db:reset && pnpm db:types
pnpm dev:api        # 터미널 1
pnpm dev:inngest    # 터미널 2
cd apps/mobile && eas build --profile development --platform android   # 최초 1회, 네이티브 설정이 바뀔 때마다
pnpm dev:mobile     # 터미널 3, 개발 빌드 앱에서 접속
```

Expo Go는 쓰지 않는다. 결제·카카오 로그인·백그라운드 오디오가 동작하지 않는다.

- 앱은 환경마다 번들 ID가 다르다: development `com.o3c.eloria.dev`, preview `.preview`, production `com.o3c.eloria`(`app.config.ts`, EAS 프로필의 `APP_ENV`). 소셜 로그인 콘솔에는 세 ID를 모두 등록한다.
- 유료 AI 키가 없을 때는 `apps/api/.env`의 `PROVIDER_MODE=mock`으로 생성 파이프라인을 개발한다.
- Android 에뮬레이터에서는 `localhost` 대신 `10.0.2.2`, 실기기에서는 PC의 LAN IP를 `EXPO_PUBLIC_API_URL`·`EXPO_PUBLIC_SUPABASE_URL`에 쓴다.

## 3. 환경 변수

키는 `.env.example`에 있다. 비밀 값은 저장소에 커밋하지 않고, 배포 환경에는 Vercel·EAS Secrets에 넣는다.

| 변수 | 위치 | 설명 |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | 앱 | 공개 키 |
| `EXPO_PUBLIC_API_URL` | 앱 | API 서버 주소 |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | 앱 | RevenueCat public SDK key |
| `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_SENTRY_DSN` | 앱 | |
| `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` | 앱 | 카카오 네이티브 앱 키(공개 가능 값) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | API | 서버 전용 |
| `SUPABASE_JWT_SECRET` | API | 레거시 HS256 서명일 때만. 비대칭 서명 키를 쓰는 프로젝트는 JWKS 엔드포인트로 검증 |
| `GEMINI_API_KEY`, `GEMINI_STORY_MODEL`, `GEMINI_SAFETY_MODEL` | API | 유료 티어 키 |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_WEBHOOK_SECRET`, `ELEVENLABS_*_MODEL` | API | |
| `REVENUECAT_WEBHOOK_AUTH`, `REVENUECAT_SECRET_KEY` | API | |
| `PORT` | API | 기본 8787 |
| `PROVIDER_MODE` | API | `live`(기본) 또는 `mock`. mock은 외부 AI를 호출하지 않는다. 프로덕션 금지 |
| `INNGEST_DEV` | API | 로컬은 `1`(dev server 사용) |
| `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | API | 배포 환경 |
| `EXPO_ACCESS_TOKEN` | API | 푸시 발송 |
| `SENTRY_DSN` | API | |

## 4. 외부 서비스 설정 메모

- **Supabase**: Auth에서 Anonymous, Apple, Kakao, Google 활성화. Kakao provider에는 REST API 키와 Client Secret, Redirect URI 등록.
  - provider 키는 `supabase/.env`(git 제외)의 `SUPABASE_AUTH_EXTERNAL_KAKAO_CLIENT_ID`(`REST 키,네이티브 키`, D-20)·`..._SECRET`에 두고 `supabase config push`로 반영한다.
  - staging 프로젝트: `pprrnrnsyjkkpdebarcr`. `supabase link --project-ref pprrnrnsyjkkpdebarcr` 후 `supabase db push`, `pnpm db:types:linked`.
  - Auth 설정은 `supabase/config.toml`이 원천이다. `supabase config push`는 바뀌는 항목을 보여 주므로, 의도하지 않은 항목이 있으면 config.toml을 원격 값에 맞춘 뒤 반영한다.
  - 키 조회: `supabase projects api-keys --project-ref <ref> --reveal`(`--reveal` 없이는 secret 키가 축약돼 나온다). 새 형식 `sb_secret_` 키는 JWT가 아니므로 REST 호출 시 `apikey` 헤더에만 넣고 `Authorization: Bearer`에는 넣지 않는다.
- **RevenueCat**: App Store Connect·Play Console 연결, entitlement `premium`, 상품 월간·연간, 웹훅 URL `/v1/webhooks/revenuecat`.
- **ElevenLabs**: 워크스페이스 웹훅을 generation 이벤트에 구독, URL `/v1/webhooks/elevenlabs`. API 키에 TTS와 Image(Flows) 권한 부여.
- **Inngest**: 앱 URL을 `<API>/api/inngest`로 등록.
- **EAS**: `eas.json`의 development 프로필은 `developmentClient: true`. 카카오 네이티브 앱 키는 공개값이라 `app.config.ts`에 기본값으로 있다(EAS CLI는 .env를 읽지 않고 설정을 평가한다).
- **Kakao Developers**: 카카오 로그인 ON, OpenID Connect ON. 플랫폼 Android에 패키지명(`com.o3c.eloria.dev` 등)과 키 해시(EAS 키스토어 SHA-1의 base64), iOS에 번들 ID 등록. REST API 키의 Redirect URI에 `https://<project-ref>.supabase.co/auth/v1/callback`.
