import { PlaceholderScreen } from '@/components/placeholder-screen';
import { ko } from '@/i18n/ko';

/** 리추얼(PRD F-10: 카테고리별 사전 제작 콘텐츠, 확언). M3에서 채운다. */
export default function Rituals() {
  return (
    <PlaceholderScreen
      eyebrow={ko.common.comingSoon}
      title={ko.rituals.title}
      body={ko.rituals.body}
    />
  );
}
