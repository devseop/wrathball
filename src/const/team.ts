export const TEAMS = [
  '두산 베어스',
  '롯데 자이언츠',
  'SSG 랜더스',
  '삼성 라이온즈',
  '키움 히어로즈',
  'NC 다이노스',
  'KIA 타이거즈',
  'KT 위즈',
  '한화 이글스',
  'LG 트윈스'
] as const;

export type Team = typeof TEAMS[number]; 