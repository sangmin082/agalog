export type RecordType =
  | 'breastfeed'  // 모유
  | 'bottle'      // 수유 (분유/젖병)
  | 'pump'        // 유축
  | 'pee'         // 소변
  | 'poop'        // 대변
  | 'vomit';      // 구토

export interface RecordEntry {
  id: string;
  type: RecordType;
  startTime: string; // ISO string
  endTime?: string;  // ISO string (for timed events)
  durationMinutes?: number;
  leftMinutes?: number;   // 모유 좌측
  rightMinutes?: number;  // 모유 우측
  amountMl?: number;      // 수유/유축 ml
  note?: string;
}

export const RECORD_LABELS: Record<RecordType, string> = {
  breastfeed: '모유수유',
  bottle: '수유',
  pump: '유축',
  pee: '소변',
  poop: '대변',
  vomit: '구토',
};

export const RECORD_ICONS: Record<RecordType, string> = {
  breastfeed: '🤱',
  bottle: '🍼',
  pump: '🏺',
  pee: '💛',
  poop: '💩',
  vomit: '🤢',
};

export const RECORD_COLORS: Record<RecordType, string> = {
  breastfeed: '#FF8FAB',
  bottle: '#74C0FC',
  pump: '#A9E34B',
  pee: '#FFD43B',
  poop: '#A17246',
  vomit: '#B5A7D5',
};
