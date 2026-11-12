import { librarySeedEntrySchema, type LibrarySeedEntry } from '@eloria/shared';

/**
 * 리추얼 시드 카탈로그(PRD F-10: 카테고리당 5개). 테마는 스토리 생성의 "꿈" 자리에 들어간다.
 * 카피 원칙(PRD 10절): 결과 보장·투자·의료 조언 없이 "경험·루틴·상상"으로 쓴다.
 * key를 바꾸면 새 항목으로 다시 만들어지므로, 문구를 고칠 때는 key를 유지한다.
 * 이 문구는 실제 AI 연결 전 기본값이다(ROADMAP 열린 질문 Q-10).
 */
const ENTRIES: LibrarySeedEntry[] = [
  // money
  {
    key: 'money-cafe-morning',
    category: 'money',
    tone: 'calm',
    theme: '잔고를 확인하고 마음이 놓여 좋아하는 카페에서 느긋하게 보내는 아침',
  },
  {
    key: 'money-gift',
    category: 'money',
    tone: 'excited',
    theme: '소중한 사람에게 줄 선물을 망설임 없이 고르며 함께 기뻐하는 하루',
  },
  {
    key: 'money-home',
    category: 'money',
    tone: 'calm',
    theme: '햇살 드는 집을 내 취향대로 꾸미고 천천히 둘러보는 주말 아침',
  },
  {
    key: 'money-travel',
    category: 'money',
    tone: 'excited',
    theme: '가고 싶던 도시로 떠나 가격표보다 마음을 먼저 보는 여행의 하루',
  },
  {
    key: 'money-evening',
    category: 'money',
    tone: 'calm',
    theme: '돈 걱정 대신 좋아하는 일에 시간을 쓰는 평온한 저녁',
  },
  // love
  {
    key: 'love-slow-weekend',
    category: 'love',
    tone: 'calm',
    theme: '나를 아껴 주는 사람과 함께 맞는 느린 주말 아침',
  },
  {
    key: 'love-riverside',
    category: 'love',
    tone: 'calm',
    theme: '좋아하는 사람과 노을 진 강변을 걸으며 이야기를 나누는 저녁',
  },
  {
    key: 'love-self',
    category: 'love',
    tone: 'powerful',
    theme: '있는 그대로의 나를 아끼며 거울 속 나에게 미소 짓는 하루',
  },
  {
    key: 'love-friends-table',
    category: 'love',
    tone: 'excited',
    theme: '편안한 친구들과 웃음이 끊이지 않는 저녁 식탁',
  },
  {
    key: 'love-letters',
    category: 'love',
    tone: 'calm',
    theme: '서로를 응원하는 마음을 담은 편지를 주고받는 하루',
  },
  // career
  {
    key: 'career-presentation',
    category: 'career',
    tone: 'powerful',
    theme: '준비한 발표를 차분하게 마치고 동료들의 박수를 받는 오후',
  },
  {
    key: 'career-studio',
    category: 'career',
    tone: 'excited',
    theme: '내 이름을 건 작은 작업실에서 좋아하는 일을 시작하는 아침',
  },
  {
    key: 'career-flow',
    category: 'career',
    tone: 'calm',
    theme: '몰입해서 일한 뒤 뿌듯함을 안고 퇴근하는 저녁',
  },
  {
    key: 'career-team',
    category: 'career',
    tone: 'excited',
    theme: '믿을 수 있는 동료들과 아이디어를 나누며 웃는 회의 시간',
  },
  {
    key: 'career-new-project',
    category: 'career',
    tone: 'powerful',
    theme: '한 해 전보다 단단해진 나를 느끼며 새 프로젝트를 맡는 날',
  },
  // confidence
  {
    key: 'confidence-voice',
    category: 'confidence',
    tone: 'powerful',
    theme: '내 생각을 또렷하게 말하고 그 목소리가 좋아지는 하루',
  },
  {
    key: 'confidence-outfit',
    category: 'confidence',
    tone: 'excited',
    theme: '가장 좋아하는 옷을 입고 가벼운 발걸음으로 거리를 걷는 아침',
  },
  {
    key: 'confidence-boundary',
    category: 'confidence',
    tone: 'powerful',
    theme: '필요할 때 부드럽게 거절하고 내 시간을 지키는 하루',
  },
  {
    key: 'confidence-first-try',
    category: 'confidence',
    tone: 'excited',
    theme: '처음 해 보는 일에 설레는 마음으로 도전하는 날',
  },
  {
    key: 'confidence-mirror',
    category: 'confidence',
    tone: 'calm',
    theme: '거울 앞에서 오늘의 나를 칭찬하며 하루를 시작하는 아침',
  },
  // meditation
  {
    key: 'meditation-forest-rain',
    category: 'meditation',
    tone: 'calm',
    theme: '숲속 오두막에서 빗소리를 들으며 천천히 숨을 고르는 시간',
  },
  {
    key: 'meditation-sea-dawn',
    category: 'meditation',
    tone: 'calm',
    theme: '파도 소리에 맞춰 호흡하며 마음이 고요해지는 바닷가 새벽',
  },
  {
    key: 'meditation-night',
    category: 'meditation',
    tone: 'calm',
    theme: '하루를 내려놓고 포근한 이불 속에서 잠드는 밤',
  },
  {
    key: 'meditation-tea',
    category: 'meditation',
    tone: 'calm',
    theme: '따뜻한 차 한 잔을 두 손으로 감싸고 지금에 머무는 오후',
  },
  {
    key: 'meditation-morning-light',
    category: 'meditation',
    tone: 'calm',
    theme: '창으로 들어오는 아침빛을 느끼며 몸을 천천히 깨우는 시간',
  },

  // ── ARIN 라이브러리(Figma L01, D-47). 제목은 Figma 카드 문구 ──────────────────
  // affirmation
  {
    key: 'affirmation-enough',
    category: 'affirmation',
    tone: 'calm',
    title: '나는 존재만으로 풍요로워',
    theme: '있는 그대로의 나로 충분하다고 느끼며 하루를 여는 확언',
  },
  {
    key: 'affirmation-loved',
    category: 'affirmation',
    tone: 'calm',
    title: '나는 사랑받는 게 당연해',
    theme: '나를 아끼는 마음으로 사랑을 편안하게 받아들이는 확언',
  },
  {
    key: 'affirmation-flow',
    category: 'affirmation',
    tone: 'excited',
    title: '돈은 나에게 쉽게 흘러와',
    theme: '여유로운 마음으로 일상의 선택을 가볍게 하는 풍요의 확언',
  },
  // meditation(Figma 카드 순서)
  {
    key: 'meditation-full-moon',
    category: 'meditation',
    tone: 'calm',
    title: '보름달 끌어당김 명상',
    theme: '보름달 아래에서 바라는 삶을 천천히 그려 보는 명상',
  },
  {
    key: 'meditation-love-again',
    category: 'meditation',
    tone: 'calm',
    title: '다시 사랑해도 괜찮아',
    theme: '지난 마음을 내려놓고 다시 사랑할 준비가 된 나를 만나는 명상',
  },
  {
    key: 'meditation-wealth-vessel',
    category: 'meditation',
    tone: 'calm',
    title: '부의 그릇 넓히기',
    theme: '여유로운 삶을 받아들일 만큼 마음의 그릇이 넓어지는 상상 명상',
  },
  // sleep
  {
    key: 'sleep-rain',
    category: 'sleep',
    tone: 'calm',
    title: '빗소리와 잠드는 확언',
    theme: '창밖 빗소리를 들으며 오늘의 나를 다독이고 잠드는 밤',
  },
  {
    key: 'sleep-star-sea',
    category: 'sleep',
    tone: 'calm',
    title: '별이 쏟아지는 바닷가',
    theme: '별이 가득한 바닷가에 누워 파도에 맞춰 숨이 느려지는 밤',
  },

  // ── 소원별로 듣기(Figma L06): 테마마다 확언 · 명상 · 수면 ─────────────────────
  {
    key: 'wish-exam-affirmation',
    category: 'affirmation',
    wishTheme: 'exam',
    tone: 'powerful',
    title: '나는 준비된 사람이야',
    theme: '그동안 쌓아 온 노력을 믿으며 차분하게 시험장으로 향하는 확언',
  },
  {
    key: 'wish-exam-meditation',
    category: 'meditation',
    wishTheme: 'exam',
    tone: 'calm',
    title: '합격 문자를 받는 아침',
    theme: '원하던 소식을 받은 아침, 가족과 기쁨을 나누는 장면을 그려 보는 명상',
  },
  {
    key: 'wish-exam-sleep',
    category: 'sleep',
    wishTheme: 'exam',
    tone: 'calm',
    title: '시험 전날 밤의 평온',
    theme: '긴장을 내려놓고 내일의 나를 믿으며 깊이 잠드는 밤',
  },
  {
    key: 'wish-home-affirmation',
    category: 'affirmation',
    wishTheme: 'home',
    tone: 'calm',
    title: '나는 나만의 공간을 가꿔',
    theme: '내 취향으로 채운 공간에서 편안함을 느끼는 나를 그리는 확언',
  },
  {
    key: 'wish-home-meditation',
    category: 'meditation',
    wishTheme: 'home',
    tone: 'calm',
    title: '햇살 드는 내 이름의 집',
    theme: '햇살 가득한 내 집의 문을 열고 들어서는 첫날을 그려 보는 명상',
  },
  {
    key: 'wish-home-sleep',
    category: 'sleep',
    wishTheme: 'home',
    tone: 'calm',
    title: '내 집 창가에서 잠드는 밤',
    theme: '좋아하는 이불과 조명이 있는 내 방 창가에서 포근하게 잠드는 밤',
  },
  {
    key: 'wish-job-affirmation',
    category: 'affirmation',
    wishTheme: 'job',
    tone: 'powerful',
    title: '나는 내 가치를 알아',
    theme: '내 경험과 강점을 당당하게 이야기하는 나를 그리는 확언',
  },
  {
    key: 'wish-job-meditation',
    category: 'meditation',
    wishTheme: 'job',
    tone: 'calm',
    title: '나를 알아보는 곳으로',
    theme: '내 능력을 알아보는 동료들과 즐겁게 일하는 하루를 그려 보는 명상',
  },
  {
    key: 'wish-job-sleep',
    category: 'sleep',
    wishTheme: 'job',
    tone: 'calm',
    title: '내일이 기대되는 밤',
    theme: '하루를 잘 마친 나를 칭찬하며 설레는 내일을 기다리며 잠드는 밤',
  },
  {
    key: 'wish-love-affirmation',
    category: 'affirmation',
    wishTheme: 'love',
    tone: 'calm',
    title: '나는 사랑을 주고받아',
    theme: '서로를 아끼는 관계 속에서 편안한 나를 그리는 확언',
  },
  {
    key: 'wish-love-meditation',
    category: 'meditation',
    wishTheme: 'love',
    tone: 'calm',
    title: '서로를 알아보는 사랑',
    theme: '나를 있는 그대로 바라봐 주는 사람과 걷는 저녁을 그려 보는 명상',
  },
  {
    key: 'wish-love-sleep',
    category: 'sleep',
    wishTheme: 'love',
    tone: 'calm',
    title: '사랑받는 마음으로 잠들기',
    theme: '오늘 받은 다정함을 떠올리며 따뜻한 마음으로 잠드는 밤',
  },
  {
    key: 'wish-body-affirmation',
    category: 'affirmation',
    wishTheme: 'body',
    tone: 'powerful',
    title: '나는 내 몸을 아껴',
    theme: '움직이고 쉬는 매일의 루틴으로 내 몸을 돌보는 나를 그리는 확언',
  },
  {
    key: 'wish-body-meditation',
    category: 'meditation',
    wishTheme: 'body',
    tone: 'calm',
    title: '내 몸이 좋아지는 중',
    theme: '가벼워진 몸으로 아침 산책을 하며 숨이 깊어지는 장면을 그려 보는 명상',
  },
  {
    key: 'wish-body-sleep',
    category: 'sleep',
    wishTheme: 'body',
    tone: 'calm',
    title: '몸이 쉬어 가는 밤',
    theme: '하루 동안 애쓴 몸을 천천히 풀며 깊이 쉬는 밤',
  },
  {
    key: 'wish-travel-affirmation',
    category: 'affirmation',
    wishTheme: 'travel',
    tone: 'excited',
    title: '나는 자유롭게 떠나',
    theme: '가고 싶은 곳을 마음껏 떠올리고 계획하는 나를 그리는 확언',
  },
  {
    key: 'wish-travel-meditation',
    category: 'meditation',
    wishTheme: 'travel',
    tone: 'excited',
    title: '떠나고 싶을 때 떠나는 삶',
    theme: '낯선 도시의 골목을 걸으며 설렘을 느끼는 여행의 하루를 그려 보는 명상',
  },
  {
    key: 'wish-travel-sleep',
    category: 'sleep',
    wishTheme: 'travel',
    tone: 'calm',
    title: '여행지 호텔에서 잠드는 밤',
    theme: '여행지의 조용한 호텔 방에서 하루를 돌아보며 잠드는 밤',
  },
];

export const LIBRARY_CATALOG: readonly LibrarySeedEntry[] = ENTRIES.map((e) =>
  librarySeedEntrySchema.parse(e),
);
