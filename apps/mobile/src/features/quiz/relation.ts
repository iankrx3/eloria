import type { Person } from '@eloria/shared';

/**
 * 퀴즈의 소중한 사람은 이름만 받는다(Figma Q11). 이름 대신 관계로 적은 경우("엄마")만 관계를 짐작하고,
 * 나머지는 "소중한 사람"으로 둔다. 관계는 마이페이지에서 고칠 수 있다.
 */
export function guessRelation(name: string): Person['relation'] {
  if (/^(엄마|아빠|어머니|아버지|언니|오빠|누나|형|동생|할머니|할아버지)$/.test(name))
    return 'family';
  if (/^(남자친구|여자친구|남편|아내|애인)$/.test(name)) return 'partner';
  if (/^(강아지|고양이|반려견|반려묘)$/.test(name)) return 'pet';
  return 'other';
}
