import { PlaceholderScreen } from '@/components/placeholder-screen';
import { ko } from '@/i18n/ko';

/** 라이브러리(PRD 6절: 내 스토리·플레이리스트·좋아요·다운로드됨). M3에서 채운다. */
export default function Library() {
  return (
    <PlaceholderScreen
      eyebrow={ko.common.comingSoon}
      title={ko.library.title}
      body={ko.library.body}
    />
  );
}
