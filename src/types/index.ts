export type RecordType =
  | 'breastfeed'  // 모유
  | 'bottle'      // 수유 (분유/젖병)
  | 'pump'        // 유축
  | 'pee'         // 소변
  | 'poop'        // 대변
  | 'vomit';      // 구토

export interface GrowthEntry {
  id: string;
  date: string;
  weightKg?: number;
  heightCm?: number;
  headCm?: number;
}

export interface RecordEntry {
  id: string;
  type: RecordType;
  startTime: string;       // ISO string
  endTime?: string;
  durationMinutes?: number; // 유축 소요 시간
  leftMinutes?: number;    // 모유 좌측
  rightMinutes?: number;   // 모유 우측
  amountMl?: number;       // 수유/유축 ml
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

// Ionicons icon names for each record type
export const RECORD_ICON_NAMES: Record<RecordType, string> = {
  breastfeed: 'heart',
  bottle: 'water',
  pump: 'flask',
  pee: 'water-outline',
  poop: 'ellipse',
  vomit: 'alert-circle',
};

// Keep legacy emoji map for Alert messages only
export const RECORD_ICONS: Record<RecordType, string> = {
  breastfeed: '🤱',
  bottle: '🍼',
  pump: '🏺',
  pee: '💛',
  poop: '💩',
  vomit: '🤢',
};

export const RECORD_COLORS: Record<RecordType, string> = {
  breastfeed: '#E5484D',
  bottle: '#3E63DD',
  pump: '#30A46C',
  pee: '#F0B429',
  poop: '#D4875E',
  vomit: '#8E4EC6',
};
