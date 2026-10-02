# AI 파이프라인

꿈 한 줄은 Gemini로 장면 계획 → 스토리 → 안전 검수를 거쳐 텍스트로 먼저 공개되고, ElevenLabs로 음성과 표지를 만든다. 품질은 프롬프트가, 원가는 음성 글자 수가 좌우한다.

## 1. 모델 (환경 변수로 주입, 코드에 하드코딩 금지)

| 용도 | 환경 변수 | 기본값 | 비고 |
| --- | --- | --- | --- |
| 장면 계획·스토리 | `GEMINI_STORY_MODEL` | `gemini-3-flash-preview` | 2주차 블라인드 테스트로 3.8 Flash·3.1 Pro와 비교 후 확정 |
| 안전 검수·분류 | `GEMINI_SAFETY_MODEL` | `gemini-3.1-flash-lite` | JSON 출력 |
| 스토리 음성 | `ELEVENLABS_STORY_MODEL` | `eleven_v3` | 요청당 5,000자 한도, 요청 스티칭 불가 |
| 짧은 음성(확언·데일리 후보) | `ELEVENLABS_SHORT_MODEL` | `eleven_flash_v2_5` | 비용 절반 |
| 긴 콘텐츠 예비 | `ELEVENLABS_LONG_MODEL` | `eleven_multilingual_v2` | 10,000자, 스티칭 가능 |
| 표지 이미지 | `ELEVENLABS_IMAGE_MODEL` | `gemini-3.1-flash-image` | Image API는 ElevenLabs Pro 플랜 이상 필요 |

모델 ID는 자주 바뀌므로 구현 시 공식 문서에서 다시 확인한다. Gemini는 유료 티어 키만 쓴다(무료 티어 입력은 Google 제품 개선에 쓰일 수 있음).

## 2. 파이프라인 단계

| 단계 | 입력 | 출력 | 실패 시 |
| --- | --- | --- | --- |
| plan | 꿈, 프로필, 사람, 퀴즈, 톤, (수정 요청) | `ScenePlan` JSON | 재시도 2회 → failed |
| write | ScenePlan, 톤, 목표 길이 | 스크립트 텍스트 | 재시도 2회 |
| review | 스크립트 | `SafetyVerdict` JSON | `rewrite`면 write 1회 재실행, 그래도 실패면 failed(`SAFETY_BLOCKED`) |
| tts | 스크립트, 보이스 | MP3 → `story-audio` | 재시도 2회, 실패해도 텍스트는 유지(status=text_ready) |
| cover | ScenePlan.imagePrompt | 이미지 → `story-covers` | 실패 시 카테고리 기본 이미지 사용 |

## 3. 상태 전이

```text
queued → planning → writing → reviewing → text_ready → audio_ready → ready
                                    └→ failed(SAFETY_BLOCKED)      (어느 단계든) → failed(error_code)
```

`ready` = 음성과 표지 모두 완료. 표지가 늦으면 `audio_ready`에서 재생을 시작하고 표지는 도착 시 교체한다.

## 4. 프롬프트

프롬프트는 `packages/prompts/src/<name>/v<n>.ts`에 템플릿 함수로 두고, `stories.prompt_version`에 `<name>@v<n>`을 기록한다. 프롬프트를 바꾸면 버전을 올리고 5절 평가 세트를 돌린다.

### 4.1 ScenePlan 스키마 (`packages/shared/src/ai/scene-plan.ts`)

```ts
ScenePlan = {
  title: string            // 12자 이내, 예: "청담의 아침"
  goal: string             // 사용자의 꿈을 한 문장으로
  setting: { place: string; timeOfDay: 'dawn'|'morning'|'afternoon'|'evening'|'night'; season?: string }
  beats: Array<{           // 4~6개, 지원서 구조: 목표 → 상황 → 감정 → 행동 → 일상
    kind: 'arrival'|'situation'|'emotion'|'action'|'daily_life'|'gratitude'
    description: string
    sensoryDetails: string[] // 시각·청각·촉각·후각 중 2개 이상
  }>
  identityStatements: string[] // "나는 ~한 사람입니다" 2~3개
  people: Array<{ name: string; role: string }> // 프로필의 사람만, 새 인물 창작 금지
  imagePrompt: string      // 영어, 얼굴이 특정되지 않는 장면, 인물은 뒷모습·실루엣
  tone: 'calm'|'excited'|'powerful'
}
```

Gemini 호출은 `responseMimeType: 'application/json'` + `responseSchema`(zod → JSON Schema 변환)로 구조화 출력을 강제하고, 응답은 zod로 다시 검증한다.

### 4.2 스토리 작성 규칙 (system prompt에 포함)

- 한국어, 2인칭 존댓말 현재형("당신은 커튼을 엽니다"). 사용자 이름을 1~3회 자연스럽게 부른다.
- 이미 이루어진 삶의 **하루**를 보여 준다. 결과(돈의 액수, 직함)보다 그 삶의 감정, 태도, 일상 행동을 묘사한다.
- 문장은 짧게, 낭독용으로 쓴다. 숫자·영문·기호는 읽는 대로 한글로 풀어 쓴다(예: "10억" → "십억", "PT" → "피티").
- 사람 이름은 `people`에 있는 것만 쓴다. 실존 유명인, 브랜드 과시 나열, 타인을 조종하는 내용 금지.
- 연애 테마는 특정인의 마음을 바꾸는 내용이 아니라 "사랑받고 안정된 나"로 쓴다.
- 마지막 단락은 감사와 정체성 문장으로 닫는다.
- 목표 길이: 설정값 `STORY_TARGET_CHARS`(기본 3,200자, 최대 3,800자). 데일리는 `DAILY_TARGET_CHARS`(기본 700자).
- 문단 사이에 쉼을 위한 빈 줄. v3 오디오 태그(예: 부드러운 톤)는 보이스 테스트 후 허용 목록을 정해 사용한다.

### 4.3 안전 검수 (`SafetyVerdict`)

```ts
SafetyVerdict = {
  verdict: 'pass' | 'rewrite' | 'block'
  reasons: Array<'guaranteed_outcome'|'financial_advice'|'medical_claim'|'self_harm'|'real_person'|'manipulation'|'sexual'|'minor'|'other'>
  notes?: string
}
```

- 입력(꿈) 단계에서도 같은 분류를 먼저 돌려, `block`이면 생성하지 않고 부드러운 안내 문구를 보여 준다.
- 자해·위기 신호가 있으면 스토리를 만들지 않고, 도움을 받을 수 있는 곳을 안내하는 화면으로 보낸다(문구는 `ko.ts`의 `safety.support*`).

### 4.4 수정(revise)

입력 = 원본 ScenePlan + 원본 스크립트 + 수정 요청. 출력 = 새 ScenePlan과 스크립트, 그리고 `changedParagraphIndexes: number[]`(앱의 하이라이트용). 표지는 재사용한다.

## 5. 평가 세트

- `packages/prompts/eval/dreams.jsonl`: 꿈 샘플 30개(카테고리별 6개, 짧은 입력·모호한 입력·위험 입력 포함).
- `pnpm eval:story`로 모델별 결과를 생성해 `eval/out/<date>/`에 저장하고, 사람이 1~5점(몰입감, 개인화, 자연스러운 한국어, 낭독 적합성)으로 블라인드 채점한다.
- 위험 입력 5개는 반드시 `block` 또는 안전한 재작성으로 끝나야 한다(자동 테스트).

## 6. 원가 상한과 설정값

모두 `packages/shared/src/config/limits.ts`의 상수로 두고, 운영 중 바꿀 수 있게 원격 설정(`app_config` 테이블)을 우선 적용한다.

| 설정 | 기본값 | 설명 |
| --- | --- | --- |
| `STORY_TARGET_CHARS` | 3,200 | 스토리 목표 글자 수(5분 가정, 한국어 실측 후 조정) |
| `STORY_MAX_CHARS` | 3,800 | v3 5,000자 한도 안의 안전 상한 |
| `DAILY_TARGET_CHARS` | 700 | 1~2분 |
| `FREE_STORIES_TOTAL` | 1 | 무료 사용자 전체 생성 수 |
| `SUB_STORIES_PER_MONTH` | 30 | 구독자 월 생성 수(수정 포함) |
| `SUB_VERSIONS_PER_DESIRE` | 3 | 꿈당 버전 수 |
| `DAILY_PREGEN_ACTIVE_DAYS` | 3 | 최근 N일 활성 구독자만 데일리 사전 생성 |
| `MAX_CONCURRENT_TTS` | 8 | ElevenLabs 플랜 동시성보다 낮게 |

### 단위 원가(2026-09 기준, 출시 전 재확인)

| 항목 | 단가 | 1회 추정 |
| --- | --- | --- |
| Gemini 3 Flash | 입력 $0.50 / 출력 $3.00 (100만 토큰당) | 스토리 1회 약 $0.03 |
| ElevenLabs v3 | 1,000자당 $0.10 | 3,200자 약 $0.32 |
| ElevenLabs Flash v2.5 | 1,000자당 $0.05 | 데일리 700자 약 $0.035 |
| 표지 이미지 | 크레딧제 | 콘솔에서 확인 |

`est_cost_usd`는 어댑터가 위 단가 표(`packages/providers/src/pricing.ts`)로 계산해 `generation_jobs`에 기록한다. 지원서의 1회 $0.12~0.20 가정은 음성 1,200~2,000자일 때 성립하므로, 5분 분량을 유지하면 원가가 더 높다(열린 질문 Q-02).

## 7. 음성·이미지 세부

- **음성 캐시 키**: `sha256(model + voiceId + normalizedText + settingsJson)`. `story_assets.content_hash`, `affirmations.audio_hash`에 저장하고 같은 키면 재사용.
- **이름 발음**: `people.pronunciation`, `profiles.name_pronunciation`이 있으면 스크립트에 그 표기로 넣는다. 부족하면 ElevenLabs 발음 사전(v3에서 한국어 IPA 지원)을 사용자별로 만든다(P1).
- **출력 형식**: MP3 44.1kHz 128kbps. `duration_sec`는 파일에서 계산해 저장.
- **이미지 프롬프트 규칙**: 영어, 세로 9:16, 따뜻한 필름 톤, 인물은 뒷모습·실루엣·손만, 텍스트·로고·브랜드 금지. 결과 URL은 약 1시간 후 만료되므로 웹훅 수신 즉시 내려받는다.
- **배경 사운드**: ElevenLabs Sound Effects·Music으로 한 번 만들어 `soundscapes` 버킷에 올린다(`scripts/seed-soundscapes.ts`). 런타임 생성 없음.
