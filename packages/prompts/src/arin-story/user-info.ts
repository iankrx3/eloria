import type { QuizAnswers } from '@eloria/shared';
import type { ArinUserInfo } from './pending';

const GENDER: Record<string, string> = {
  female: '여성',
  male: '남성',
  other: '기타',
  undisclosed: '',
};

const LOVE: Record<string, string> = {
  single: '솔로',
  dating: '연애 중',
  complicated: '복잡한 사이',
  married: '결혼',
};

const MORNING: Record<string, string> = {
  han_river_view: '한강뷰',
  night_view: '반짝이는 야경',
  jeju_sea: '제주 바다',
  forest_garden: '숲과 정원',
  sunset_terrace: '노을 지는 테라스',
  white_curtains: '하얀 커튼과 햇살',
  foreign_street: '낯선 나라의 거리',
  snowy_mountain: '눈 덮인 산',
  current_window: '지금 우리 집 창밖',
};

const RELATION: Record<string, string> = {
  partner: '연인',
  family: '가족',
  friend: '친구',
  pet: '반려동물',
  other: '소중한 사람',
};

export type ArinUserSource = {
  displayName: string | null;
  /** 직접 소원이면 사용자가 적은 문장. 오늘의 이야기면 퀴즈 소원으로 바꾼다. */
  todayWish: string;
  quiz: Partial<QuizAnswers>;
  people: { name: string; relation: string }[];
  lifestyle: string[];
  exclude: string[];
  recentLines: string[];
};

const text = (value: string | null | undefined) => (value ?? '').replace(/[<>]/g, '').trim();

/**
 * 인수인계 5번 사용자 정보.
 * recent_lines와 wish_facts는 있을 때만 넣는다. 나머지 키는 값이 없어도 남긴다.
 */
export function buildArinUserInfo(source: ArinUserSource): ArinUserInfo {
  const quiz = source.quiz;
  const loveIncluded = typeof quiz.love_desired === 'string' && quiz.love_desired.trim().length > 0;
  const specific =
    quiz.has_person === 'yes' && loveIncluded ? text(quiz.person_name) : '';
  const people = source.people.map((p) => {
    const role = RELATION[p.relation] ?? '소중한 사람';
    return `${role} ${text(p.name)}`.trim();
  });
  const mornings = (quiz.dream_home ?? [])
    .map((key) => MORNING[key])
    .filter((v): v is string => Boolean(v));

  const info: ArinUserInfo = {
    name: text(quiz.name ?? source.displayName),
    age: typeof quiz.age === 'number' ? quiz.age : '',
    gender: quiz.gender ? (GENDER[quiz.gender] ?? '') : '',
    today_wish: text(source.todayWish),
    quiz: {
      wish: text(quiz.desire),
      why: text(quiz.desire_why),
      obstacle: text(quiz.desire_blocker),
      love: quiz.relationship_status ? (LOVE[quiz.relationship_status] ?? '') : '',
      love_included: loveIncluded,
      desired_love: loveIncluded ? text(quiz.love_desired) : '',
      specific_person: specific,
      people,
      mornings,
      dream_day: text(quiz.dream_days),
    },
    lifestyle: source.lifestyle.map((v) => text(v)).filter(Boolean),
    exclude: source.exclude.map((v) => text(v)).filter(Boolean),
  };
  const recent = source.recentLines.map((v) => text(v)).filter(Boolean);
  if (recent.length > 0) info.recent_lines = recent;
  return info;
}
