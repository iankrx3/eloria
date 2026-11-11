# 디자인

기준은 Figma "ARIN"(파일 `arin - 승찬`, 페이지 01 Brand · 02 Quiz · 03 Home · 04 Library · 05 Affirmations · 06 My Page)이다. 값이 바뀌면 이 문서와 `apps/mobile/src/theme/`(tokens.json, typography.ts, effects.ts)을 함께 고친다. 결정 배경은 DECISIONS D-38~D-41.

## 1. 브랜드

- 앱 표시 이름: **ARIN** / 태그라인: "A BRIGHTER YOU AWAITS" / 슬로건: "상상에서, 이야기로, 마침내 현실로."
- 워드마크: Cormorant Garamond Medium 대문자, A 안에 네 꼭지 반짝임(`components/logo.tsx`). 밝은 배경은 Deep Plum, 사진 위는 흰색.
- 상징: 은은하게 빛나는 초승달 하나(`components/moon.tsx`, `assets/images/brand/moon-symbol.png`). 유리 구슬·오브로 그리지 않는다.
- 키워드: Dreamy · Soft · Quietly Luxurious · Intimate · Hopeful.
- 코드·레포·번들 ID 이름은 Eloria 그대로다(D-38).

## 2. 토큰 (NativeWind 테마, `src/theme/tokens.json`)

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `pearl` | #F7F2FA | 카드·표면, 탭 바, 시트 바탕 |
| `lavender` | #E6D9F0 | 메인 배경 톤 |
| `sky` | #CCD6F2 | 하늘색 보조 톤 |
| `blush` | #F6E6EA | 그라디언트·사진 안에서만(UI 글자색 금지) |
| `plum` | #714D7F | 주 버튼·로고 포인트·활성 탭 |
| `plum-deep` | #3E2A4F | 텍스트·아이콘 |
| `ink-soft` / `ink-faint` | Deep Plum 65% / 45% | 보조 텍스트 / placeholder(연한 모브를 글자색으로 쓰지 않는다) |
| `twilight` | #1F1A33 | 플레이어·사진 화면 바탕 |
| `amber` | #D9A86C | 따뜻한 빛 포인트에만 |
| `glass` / `glass-border` | 흰 62% / 흰 90% | 밝은 화면의 유리 카드 |
| `on-photo` | #FFFFFF | 사진 위 글자 |
| `kakao`, `kakao-label` | #FEE500, #191919 | 카카오 버튼 전용(가이드 고정값, 라운드 12) |

- 그라디언트(`effects.ts`): Day · Dawn(#F6E6EA → #E6D9F0 → #CCD6F2), Night · Twilight(#1F1A33 → #3E2A4F), 사진 오버레이(보랏빛 필름 + 위아래 어둡게). RN 0.86 `experimental_backgroundImage`로 그린다(D-41).
- 라운드: 카드 22~28, 입력·선택지 16, 그리드 칸 14, 버튼·칩 999, 시트 28.
- 간격: 화면 좌우 24(`px-gutter`), 섹션 사이 24~32.
- 배경 흐림: 사진 위 유리는 expo-blur로 흐린다(D-42). 밝은 화면은 반투명 흰색.

## 3. 타이포그래피 (`src/theme/typography.ts`)

| 이름 | 글꼴 | 크기/행간 |
| --- | --- | --- |
| H1 | 마루 부리 SemiBold | 30/140%, 자간 -1% |
| H2 | 마루 부리 SemiBold | 22/140% |
| Story Subtitle | 마루 부리 Regular | 28/145%(플레이어 자막·시네마틱) |
| Body / Body Medium | Pretendard Regular / Medium | 16/150% |
| Caption | Pretendard Regular | 12/140% |
| EN Label | Cormorant Garamond SemiBold | 12, 자간 넓게, 대문자 |

- 글꼴은 `assets/fonts`에 번들하고 루트 레이아웃이 `useFonts`로 불러온다(라이선스 `assets/fonts/LICENSES.md`, 모두 SIL OFL).
- 사용자 지정 글꼴은 `fontWeight` 대신 글꼴 이름(`font-serif-semibold` 등)으로 굵기를 고른다.

## 4. 화면 구성

하단 탭(떠 있는 알약): **홈 · 라이브러리 · 확언 · 마이페이지**. 미니 플레이어는 재생 중일 때만 탭 바 위에 뜬다. 각 화면은 `useBottomSpace()`만큼 아래 여백을 둔다.

| 화면 | Figma | 내용 |
| --- | --- | --- |
| 퀴즈 | Q01~Q13, I01 | 사진 배경 + 진행 바 + 섹션 라벨("THE BASICS 1 / 3") + 큰 질문 + 아래쪽 유리 입력/선택지. 단일 선택은 고른 보기를 0.2초 보여 주고 넘어간다 |
| 시네마틱 | C1~C4 | 사진 4장, 2.8초 자동 전환. 마지막 "끌어당기기 시작" |
| 로그인 | S01 | 초승달·워드마크, 카카오(메인)·Apple(iOS) 같은 크기, 약관 문구 |
| 홈 | H01 | 워드마크, 오늘의 달, "○○님, 오늘은 무엇을 끌어당길까요?", 꿈 입력, 추천 칩 6개(탭 = 예시 문장 채우기), 당신을 위한 이야기 카드 |
| 생성 진행 | H04 → H06 | 하늘 사진 위 3단계(장면 고르기·이야기 쓰기·목소리 입히기) → 완성되면 이야기 사진 위 제목과 들어보기 |
| 플레이어 | H07 | 이야기 사진 + 어두운 오버레이, 현재 문단 자막, 전체 이야기 보기, 반복, 진행 바, 컨트롤(좋아요·10초·재생·10초·배경음), 공유 |
| 전체 이야기 | H08 | 밝은 시트, 재생 중인 문단만 진하게 |
| 페이월 | H09 | 홈 첫 진입 시 1회, 닫기는 3초 뒤. 결제는 M5 |
| 라이브러리 | L01·L04 | 필터 칩, 대표 카드, 카테고리별 가로 캐러셀, 칩을 고르면 세로 목록 |
| 확언 | A01~A05 | 백엔드 전까지 준비 중 카드(D-40) |
| 마이페이지 | P01·P03 | 아바타·이름, 멤버십 카드, 숫자 3개, 내 라이브러리, 기본 정보(이름·나이·성별), 내 사람들, 반려동물, 라이프스타일, 이야기에서 빼줘, 계정. 편집은 아래에서 올라오는 시트 |

Figma에 있지만 아직 만들지 않은 화면(데이터·기능 필요): 비전 고르기(H05), 목소리 고르기(H10), 연속 기록(H11), 21일 챌린지(H12), 목표 수정(H13), 소원 테마 묶음(L06), 확언 스와이프·저장·공유(A01~A05), 설정(P02), 회원 탈퇴(P04). ROADMAP 참고.

## 5. 모션·접근성

- 전환은 페이드(시네마틱 600ms 크로스페이드). 반복 애니메이션은 초승달의 은은한 빛(opacity 0.7 ↔ 1) 하나만.
- "동작 줄이기"가 켜져 있으면 초승달 애니메이션을 끈다.
- 사진 위 글자는 그림자(text-shadow)와 오버레이로 대비를 맞춘다. 밝은 화면 본문은 Deep Plum 65% 이상.
- 모든 아이콘 버튼에 `accessibilityLabel`(한국어).
- 햅틱(`src/lib/haptics.ts`, D-42). 설정 > 햅틱 진동으로 끌 수 있다. Figma 노트 기준:

| 동작 | 햅틱 |
| --- | --- |
| 버튼·칩·카드·행·탭 이동(기본) | light / 탭 바 selection |
| 퀴즈 보기·그리드 칸·관계·성별 선택, 반복 토글, 페이월 플랜 | selection |
| 퀴즈 마지막 "계속하기", 홈 전송, 라이브러리 재생 | medium |
| 시네마틱 시작, 하트 켜기, 로그인 완료, 이야기 완성 | success |
| 전환 화면·세 번째 시네마틱 진입 | soft |
| 로그인 실패 / 이야기 지우기 확인 | error / warning |

- 사진 위 유리 요소는 실제로 사진을 흐린다(`GlassFill`, Figma backdrop-blur 값). 밝은 화면에서는 반투명 흰색만 칠한다.

## 6. 카피 톤

- 존댓말, 짧은 문장, 이름 뒤 "님"(D-37). 이모지는 쓰지 않는다.
- 결과를 약속하지 않는다: "이루어집니다" 대신 "그려 보세요", "기다리고 있어요".
- 오류 문구도 다정하게: "잠시 후 다시 시도해 주세요."
