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
];

export const LIBRARY_CATALOG: readonly LibrarySeedEntry[] = ENTRIES.map((e) =>
  librarySeedEntrySchema.parse(e),
);
