# AI 파이프라인

꿈 한 줄은 Gemini로 장면 계획 → 스토리 → 안전 검수를 거쳐 텍스트로 먼저 공개되고, ElevenLabs로 음성과 표지를 만든다. 품질은 프롬프트가, 원가는 음성 글자 수가 좌우한다.

## 1. 모델 (환경 변수로 주입, 코드에 하드코딩 금지)

| 용도 | 환경 변수 | 기본값 | 비고 |
| --- | --- | --- | --- |
| 장면 계획·스토리·확언 | `GEMINI_STORY_MODEL` | `gemini-3.6-flash` | 안정판. 아린 이야기 작성만 생각 수준 high·타임아웃 120초(D-50). 그 외 글 호출은 low, 검수는 minimal, 타임아웃 60초 |
| 안전 검수·분류 | `GEMINI_SAFETY_MODEL` | `gemini-3.1-flash-lite` | JSON 출력, 생각 수준 minimal |
| 스토리 음성 | `ELEVENLABS_STORY_MODEL` | `eleven_v3` | 요청당 5,000자 한도, 요청 스티칭 불가 |
| 짧은 음성(확언·데일리 후보) | `ELEVENLABS_SHORT_MODEL` | `eleven_flash_v2_5` | 비용·크레딧 절반(글자당 0.5크레딧), 40,000자 |
| 긴 콘텐츠 예비 | `ELEVENLABS_LONG_MODEL` | `eleven_multilingual_v2` | 10,000자, 스티칭 가능 |
| 표지 이미지 | `ELEVENLABS_IMAGE_MODEL` | `gemini-3.1-flash-image` | Image API는 ElevenLabs Pro 플랜 이상 필요 |

모델 ID는 자주 바뀌므로 구현 시 공식 문서에서 다시 확인한다. 출시·실사용자 데이터에는 유료 티어 키만 쓴다(무료 티어 입력은 Google 제품 개선에 쓰일 수 있음). 개발 중 무료 키는 가짜 프로필 시험에만 쓴다(D-45).

어댑터(`packages/providers/src/gemini`)는 `@google/genai`의 `generateContent`에 `responseJsonSchema`(zod `toJSONSchema`)로 구조화 출력을 받는다. 재시도(408·429·5xx, 최대 3회)와 타임아웃(기본 60초)은 SDK `httpOptions`가 하고, 아린 이야기 작성만 요청마다 120초를 넣는다. JSON이 스키마에 안 맞으면 어댑터가 한 번만 다시 부른다. 출력 토큰에는 생각 토큰을 더해 비용을 계산한다. 생각 과정(`thought`)은 버리고 본문만 JSON으로 파싱한다. 테스트와 `eval:story`는 기본으로 Gemini를 부르지 않는다(`eval:story --live` 필요, `--max-calls` 기본 150). `eval:story`와 라이브러리는 아래 4.1~4.2를 그대로 쓴다.

## 2. 파이프라인 단계

| 단계 | 입력 | 출력 | 실패 시 |
| --- | --- | --- | --- |
| plan | 꿈, 프로필, 사람, 퀴즈, 톤, (수정 요청) | `ScenePlan` JSON | 재시도 2회 → failed |
| write | ScenePlan, 톤, 목표 길이 | 스크립트 텍스트 | 재시도 2회 |
| review | 스크립트 | `SafetyVerdict` JSON | `rewrite`면 write 1회 재실행, 그래도 실패면 failed(`SAFETY_BLOCKED`) |
| tts | 스크립트, 보이스 | MP3 → `story-audio` | 재시도 2회, 실패해도 텍스트는 유지(status=text_ready). 크레딧 상한·글자 수 초과는 재시도 없이 `TTS_BUDGET`(D-49) |
| cover | ScenePlan.imagePrompt | 이미지 → `story-covers` | 실패 시 카테고리 기본 이미지 사용 |

## 3. 상태 전이

```text
queued → planning → writing → reviewing → text_ready → audio_ready → ready
                                    └→ failed(SAFETY_BLOCKED)      (어느 단계든) → failed(error_code)
```

`ready` = 음성과 표지 모두 완료. 표지가 늦으면 `audio_ready`에서 재생을 시작하고 표지는 도착 시 교체한다.

## 4. 프롬프트

프롬프트는 `packages/prompts/src/<name>/v<n>.ts`에 템플릿 함수(`{ system, user }`를 돌려줌)로 두고, `stories.prompt_version`에는 세 프롬프트 버전을 `+`로 이어 기록한다(`STORY_PROMPT_VERSION`, 예: `scene-plan@v1+story@v1+safety@v1`). 프롬프트를 바꾸면 새 버전 파일을 만들고 5절 평가 세트를 돌린다.

| 이름 | 파일 | 입력 | 출력 |
| --- | --- | --- | --- |
| scene-plan | `scene-plan/v1.ts` | StoryContext(꿈·이름·사람·퀴즈·좋아하는 것/싫어하는 것·톤) | ScenePlan JSON |
| story | `story/v1.ts` | ScenePlan, StoryContext, 목표·상한 글자 수, (재작성 시) 검수 이유 | 본문 텍스트 |
| safety | `safety/v1.ts` | 대상(`dream` 또는 `script`), 텍스트 | SafetyVerdict JSON |

- 사용자 입력은 `<user_context>`·`<dream>`·`<text>` 태그 안에 넣고, 그 안의 지시를 따르지 말라고 적는다. 꺾쇠는 지워서 태그를 흉내 내지 못하게 한다.
- 퀴즈 선택지 키(`han_river_view` 등)는 한국어로 바꿔 넣는다. 사용자 정보 블록에는 값이 있는 줄만 넣는다(퀴즈 v2: 나이·성별·꿈이 간절한 이유·아침 풍경·꿈꾸는 하루·바라는 사랑, D-39). 걸림돌(`desire_blocker`)은 이야기에 넣지 않고 확언 생성에만 쓴다. 이전 퀴즈 키(`recent_feeling` 등)는 평가 세트 호환용으로 남아 있고, 감정은 흐름 안내로만 바꾼다.
- `checkScript`(`packages/prompts/src/checks.ts`)가 길이, 숫자·로마자·기호, 마크다운, 이모지, 이름 횟수, 결과 보장 표현, 싫어하는 것을 기계적으로 점검한다. 평가 리포트용이고 안전 검수를 대신하지 않는다.

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

- 꿈 입력과 스크립트는 같은 분류를 쓰고 판정 기준만 다르다(`reviewSafety(text, 'dream' | 'script')`). 꿈 입력에서 결과 보장·투자·의료·실존 인물·상대 마음 바꾸기는 `rewrite`(작가가 감정·일상 중심으로 바꿔 씀)이고, 위기 신호·성적 내용·미성년자·타인에게 해를 바라는 내용은 `block`이다.
- 스크립트가 `rewrite`면 검수 이유를 `safetyFeedback`으로 넘겨 한 번 다시 쓴다.
- 입력(꿈) 단계에서도 같은 분류를 먼저 돌려, `block`이면 생성하지 않고 부드러운 안내 문구를 보여 준다.
- 자해·위기 신호가 있으면 스토리를 만들지 않고, 도움을 받을 수 있는 곳을 안내하는 화면으로 보낸다(문구는 `ko.ts`의 `safety.support*`).

### 4.4 오늘의 확언

탭은 별도 Gemini 호출을 하지 않는다(D-50). `GET /v1/affirmations/today`는 그날 오늘의 이야기 JSON `affirmations` 3줄을 저장한다. 주제가 없으면 `오늘`로 둔다. 이야기가 아직 없으면 `FALLBACK_AFFIRMATIONS`의 앞 3줄을 `fallback@v1`로 저장하고, 그 날짜는 이야기가 끝나도 바꾸지 않는다. 연속 기록은 3장(`ACTIVITY_RULE.AFFIRMATIONS_PER_DAY`).

`affirmation@v1` 생성기(10장 스키마, `FALLBACK_AFFIRMATIONS` 10줄)는 남겨 둔다. 오늘의 탭은 부르지 않는다. 2026-11-12 live 1회 기록: 10개 4.2초, 입력 650·출력 394토큰, 약 $0.002.

### 4.5 라이프스타일 추천(`lifestyle@v1`, D-46)

- 마이페이지 ↻. 확언 맥락 + 사는 곳·하는 일로 20자 이내 명사구 3~6개(`lifestyleSetSchema`). 브랜드·실존 인물·금액·의료·종교·정치·성적 지향 금지. 생각 수준 minimal.
- 칩은 이야기 프롬프트의 "좋아하는 것"으로만 들어가고 사용자가 고친 뒤 저장되므로 따로 안전 검수를 부르지 않는다(무료 쿼터 절약).
- 2026-11-12 live 1회: 1.5초, 입력 476·출력 64토큰, 약 $0.0006.

### 4.6 비전 고르기·데일리(`arin-scene@v1`, `scene-plan@v2`, D-51)

- 장면 4개 미리보기(H05)는 인수인계 10-1을 그대로 쓴다(`arinScenePrompt`). 사용자 메시지는 4.8과 같은 사용자 정보 JSON이고, 응답은 `{ scenes: [{ title, hint }] }` 4개다. 제목은 공백 포함 30자, hint는 40자. 생각 수준 low, 타임아웃은 기본 60초. 음성은 만들지 않는다.
- 미리보기만 하고 이야기를 시작하지 않으면 하루 3회에 넣지 않는다. 고른 장면으로 시작하면 4.8이고, user 메시지 끝에 `[선택한 장면]`(제목·설명)을 붙인다. 저장된 제목은 고른 장면 제목이다.
- 예전 `vision@v1`(장소·시간대·summary)과 `scene-plan@v2`는 라이브러리·퀴즈 직후 첫 이야기(장면 없음)와 평가 세트에 남는다. 이미 저장된 장면의 `summary`는 읽을 때 `hint`로 본다.
- 데일리(kind = daily)도 4.8이다. `DAILY_TARGET_CHARS`(700)는 이 경로에서 쓰지 않는다.
- 2026-11-12 live 1회(장면 제안, 예전 프롬프트): 3.2초, 입력 532·출력 393토큰, 약 $0.002. scene-plan@v2 평가 세트는 아직 돌리지 않았다(ROADMAP).

### 4.7 수정(revise)

`POST /v1/stories/:id/revise`는 원본이 `text_ready`·`audio_ready`·`ready`일 때만 자식 스토리를 만든다(kind `on_demand`, `parent_story_id`, `revision_request` ≤200자). 파이프라인은 4.8과 같다. 시스템 문장은 9번 끝에 `[수정 모드]`를 붙인 것이다. user 메시지는 사용자 정보, `[이전 이야기]` JSON, `[수정 요청]`이다. 이전 JSON은 `stories.arin_story`이고, 그 칸이 비어 있으면 스크립트를 문단·문장으로 나눠 만든 객체다. 안전 검수 rewrite는 수정 모드로 바꾸지 않고 `[안전 검수]`에 이유만 넣으며, 그때의 이전 이야기는 방금 쓴 JSON이다. 직접 소원과 합쳐 한국 시간 하루 3회. 실패·안전 차단은 세지 않는다.

### 4.8 아린 이야기 JSON(`arin-story@v1`, D-51)

오늘의 이야기, 고른 장면이 있는 직접 소원, 수정만 이 경로다. 라이브러리와 퀴즈 직후 첫 이야기(vision 없음, 수정 아님)는 4.1~4.2다.

- 모델은 `GEMINI_STORY_MODEL`(기본 `gemini-3.6-flash`). 생각 수준 `high`, `maxOutputTokens` 16000, 타임아웃 120초, `responseMimeType: application/json`.
- 시스템 문장은 인수인계 9절 전문이다(`packages/prompts/src/arin-story/pending.ts`). 10절·11절은 넣지 않고, 문장을 지어 보태지 않는다.
- 사용자 메시지는 `[사용자 정보]\n` 뒤에 JSON이다. `recent_lines`와 `wish_facts`는 있을 때만 넣고, 나머지 키는 값이 없어도 남긴다. `today_wish`는 오늘의 이야기이면 퀴즈의 소원, 직접 소원·수정이면 적은 문장이다. 사랑 질문을 건너뛰면 `love_included`는 false이고 `desired_love`·`specific_person`은 빈 문자열이다. `recent_lines`는 최근 준비된 이야기 3편의 제목·따옴표 대사·마지막 확언이다. 고른 장면은 JSON 안이 아니라 메시지 끝 `[선택한 장면]`이다.
- 저장 전 검사(`arinStorySchema`): `title`(30자, 줄바꿈 포함)·`theme`(합격·내집·커리어·돈·차·사랑·결혼·건강·여행·자신감·기타)·`image_hint`·`paragraphs`(문장 배열의 배열, 16~20문단, 문단마다 1~3문장, 문장 60자)·`affirmations`(3개, 각 40자). 본문은 문단 문장을 이어 공백을 뺀 길이가 1,400~1,600자다. 마지막 문단은 따옴표로 감싼 확언 1문장. `image_hint`는 penthouse·dressroom·contract·cafe·coffee·dinner·wedding·paris·jeju·yoga·brunch·drive 중 하나. 이름 횟수는 검사하지 않는다. 스키마가 어긋나면 어댑터가 1번 다시 생성하고, 그래도 실패면 한도를 차감하지 않는다.
- 안전 검수(`safety@v1`)는 한 문단의 문장을 공백으로 잇고 문단 사이는 빈 줄인 글에 한다. rewrite면 이유와 방금 쓴 JSON을 넘겨 1번 다시 쓴다. block은 한도를 차감하지 않는다.
- 본문은 그 형태로 `stories.script`에 둔다. JSON 원문은 `stories.arin_story`에 둔다. `scene_plan`은 null, `prompt_version`은 `arin-story@v1`(라이브러리의 `STORY_PROMPT_VERSION`과 섞지 않는다). `image_hint`·`affirmations` 컬럼에 같이 저장한다.
- 음성은 `eleven_v3`, `POST /v1/text-to-speech/{voice_id}`다. 글자별 시간은 받지 않는다. 자막은 문장 한 줄이고, 하이라이트는 글자 수 비율이다. 1,400~1,600자는 회당 1,000크레딧을 넘는 일이 많아 `text_ready` + `TTS_BUDGET`으로 끝날 수 있다(D-49 상한은 그대로).

## 5. 평가 세트

- `packages/prompts/eval/dreams.jsonl`: 꿈 샘플 30개(카테고리별 6개, 짧은 입력·모호한 입력·숫자/영어 입력·지시문 주입·위험 입력 포함). 형식은 `evalCaseSchema`(`packages/prompts/src/eval/cases.ts`). 사용자 정보는 가상의 인물 5명을 돌려 쓴다.
- 각 케이스의 `expect`: `story`(스토리가 나와야 함, 막히면 과잉 차단 경고), `safe`(위험 입력: 막히거나, 스토리에 `mustNotContain` 단어가 없어야 함), `crisis`(반드시 self_harm으로 차단).
- `pnpm eval:story`(`apps/api/src/scripts/eval-story.ts`)가 파이프라인과 같은 순서(입력 검수 → 계획 → 작성 → 검수 → 1회 재작성)로 어댑터를 부른다. 음성은 만들지 않는다. 옵션: `--models a,b,c`(모델 비교, 기본은 `GEMINI_STORY_MODEL`), `--only <id,...>`, `--mock`(외부 호출 없이 실행기 확인).
- 결과는 `packages/prompts/eval/out/<날짜-시각>/`(gitignore): `cases/<id>.md`(버전 A·B·C 나란히, 검수·점검 결과 포함), `scores.csv`(1~5점: 몰입감, 개인화, 자연스러운 한국어, 낭독 적합성), `key.json`(라벨 → 모델, 채점 후 열기), `results.json`(원본).
- 위험 입력 5개 중 하나라도 새어 나가면 종료 코드 1(`--mock`은 보고만 함).

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
| `ELEVENLABS_MAX_CREDITS_PER_CALL` | 1,000 | 음성 1회 크레딧 상한(env). 크레딧 = 글자 수 × 모델 배수(v3·Multilingual v2 = 1, Flash·Turbo v2.5 = 0.5). 넘으면 호출하지 않는다(D-49) |
| `ELEVENLABS_MONTHLY_CREDIT_LIMIT` | 10,000 | 이번 달(UTC) 음성 크레딧 상한(env). `generation_jobs`의 elevenlabs 행으로 센다. 무료 플랜 월 한도 |
| `GEMINI_DAILY_CALL_LIMIT` | 50 | 서버 전체 하루(UTC) Gemini 호출 상한(env). `generation_jobs`의 gemini 행과 이 프로세스가 가져간 수 중 큰 값으로 센다. 무료 쿼터 보호(D-45) |
| `CUSTOM_WISHES_PER_DAY` | 3 | 직접 소원(이야기를 시작한 것)과 수정. 한국 시간 자정. 진행 중은 포함하고 실패는 빼며, 오늘의 이야기와 장면 없는 첫 이야기는 세지 않는다(D-50) |

### 단위 원가(2026-09 기준, 출시 전 재확인)

| 항목 | 단가 | 1회 추정 |
| --- | --- | --- |
| Gemini 3 Flash | 입력 $0.50 / 출력 $3.00 (100만 토큰당) | 스토리 1회 약 $0.03 |
| ElevenLabs v3·Multilingual v2 (API) | 1,000자당 $0.08 (2026-11-14) | 3,200자 약 $0.26 |
| ElevenLabs Flash v2.5 (API) | 1,000자당 $0.04 (2026-11-14) | 데일리 700자 약 $0.028 |
| 표지 이미지 | 크레딧제 | 콘솔에서 확인 |

`est_cost_usd`는 어댑터가 위 단가 표(`packages/providers/src/pricing.ts`)로 계산해 `generation_jobs`에 기록한다. 라이브러리·첫 이야기의 5분 분량(3,200자)은 v3 회당 1,000크레딧을 넘는다(D-49).

아린 이야기(D-50) 글 비용은 Flash와 생각 수준 high 기준 약 35원(오늘의 이야기), 직접 소원 1회(장면 미리보기 + 본문)는 약 50원으로 본다. 음성은 Turbo로 바꾸지 않는다. 긴 글은 크레딧 상한 때문에 만들어지지 않는 일이 많아, 그때 음성 비용은 나가지 않는다. 주 9,900원 구독의 순수입은 부가세와 스토어 수수료를 빼면 약 7,650원이다. 페이월에 보이는 월 9,900원·연 59,000원은 바꾸지 않는다.

## 7. 음성·이미지 세부

- **음성 캐시 키**: `sha256(model + voiceId + normalizedText + settingsJson)`. `story_assets.content_hash`, `affirmations.audio_hash`에 저장하고 같은 키면 재사용.
- **이름 발음**: `people.pronunciation`, `profiles.name_pronunciation`이 있으면 스크립트에 그 표기로 넣는다. 부족하면 ElevenLabs 발음 사전(v3에서 한국어 IPA 지원)을 사용자별로 만든다(P1).
- **출력 형식**: MP3 44.1kHz 128kbps(무료 플랜 가능, 192kbps는 Creator 이상). `duration_sec`는 고정 비트레이트로 바이트 수에서 계산해 저장.
- **어댑터**(`packages/providers/src/elevenlabs`, D-49): REST `POST /v1/text-to-speech/{voice_id}`를 `fetch`로 부른다. `language_code: 'ko'`(Multilingual v2는 받지 않아 뺀다). 재시도는 408·429·5xx만 최대 2회, 클라이언트 타임아웃(180초)은 재시도하지 않는다(이미 만들어졌으면 크레딧이 두 번 나감). `quota_exceeded`는 `BUDGET_EXCEEDED`.
- **보이스**: voices의 `provider_voice_id`를 쓴다. 시드 자리 값(`mock-*`)이나 미선택이면 `ELEVENLABS_DEFAULT_VOICE_ID`. 예전 기본(premade) 보이스는 2026-03 이전 계정에만 있고 2026-12-31에 없어지며, 무료 플랜은 Voice Library 일부를 못 쓴다. 그래서 `tts:check`로 그 계정이 쓸 수 있는 보이스를 보고 고른다.
- **이미지 프롬프트 규칙**: 영어, 세로 9:16, 따뜻한 필름 톤, 인물은 뒷모습·실루엣·손만, 텍스트·로고·브랜드 금지. 결과 URL은 약 1시간 후 만료되므로 웹훅 수신 즉시 내려받는다.
- **배경 사운드**: ElevenLabs Sound Effects·Music으로 한 번 만들어 `soundscapes` 버킷에 올린다(`apps/api/src/scripts/seed-soundscapes.ts`, `pnpm --filter @eloria/api seed:soundscapes [--dry-run]`). 런타임 생성 없음. 지금은 같은 스크립트가 합성 루프(mock)를 올린다(D-35).
