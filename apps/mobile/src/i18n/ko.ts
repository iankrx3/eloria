/** 앱의 모든 UI 문자열. 컴포넌트에 한국어를 직접 쓰지 않는다(CLAUDE.md). */
export const ko = {
  brand: {
    name: 'Eloria',
    tagline: 'A BRIGHTER YOU AWAITS',
    slogan: '상상에서, 글로, 마침내 현실로.',
  },
  common: {
    retry: '다시 시도',
    loading: '불러오는 중이에요',
    genericError: '미래를 그리는 데 조금 더 시간이 필요해요. 잠시 후 다시 시도해 주세요.',
  },
  dev: {
    title: '개발 상태',
    session: '세션',
    sessionAnonymous: '익명 사용자',
    sessionLinked: '계정 연결됨',
    sessionNone: '로그인 전',
    api: 'API 서버',
    apiOk: '연결됨',
    apiFail: '연결 실패',
    userId: '사용자 ID',
    linkAccount: '계정 연결하기',
  },
  linkAccount: {
    title: '그려 온 미래를\n간직해 둘까요?',
    body: '계정을 연결하면 기기를 바꿔도 지금까지의 꿈과 스토리를 다시 들을 수 있어요.',
    kakao: '카카오 로그인',
    close: '닫기',
    linked: '카카오 계정이 연결됐어요.',
    switched: '이미 연결된 계정이 있어 그 계정으로 로그인했어요.',
    signedIn: '카카오 계정으로 로그인했어요.',
    cancelled: '카카오 로그인을 취소했어요.',
    failed: '계정을 연결하지 못했어요. 잠시 후 다시 시도해 주세요.',
  },
} as const;
