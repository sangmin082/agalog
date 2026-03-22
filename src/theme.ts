import { RecordType } from './types';

// ─── Design System ─── Warm modern tokens for 아가로그
export const DS = {
  // Backgrounds
  bg: '#FAFAFA',
  surface: '#FFFFFF',

  // Primary
  primary: '#5B5BD6',
  primaryLight: '#EEEEFF',

  // Accent
  accentWarm: '#F76B6B',

  // Text
  text: '#11181C',
  textSub: '#687076',
  textLight: '#889096',

  // Borders
  border: '#E8EAED',

  // Semantic
  success: '#30A46C',
  warning: '#F76B15',

  // Layout
  px: 20,
  radius: 16,
  radiusSm: 12,
  radiusXs: 8,

  // Section header style
  sectionFontSize: 11,
  sectionLetterSpacing: 1.2,
};

// Card theme — subtle, white-based cards with tinted accents
export const CARD_THEME: Record<RecordType, { accent: string; tint: string }> = {
  breastfeed: { accent: '#E5484D', tint: '#FFEFEF' },
  bottle:     { accent: '#3E63DD', tint: '#EDF2FE' },
  pump:       { accent: '#30A46C', tint: '#EDFCF2' },
  pee:        { accent: '#F0B429', tint: '#FEF9EC' },
  poop:       { accent: '#D4875E', tint: '#FEF5EE' },
  vomit:      { accent: '#8E4EC6', tint: '#F5F0FF' },
};

// Quick-tap types that don't need a modal (just one-tap save)
export const QUICK_TAP_TYPES: RecordType[] = ['pee', 'poop', 'vomit'];

// Types requiring a detail modal
export const MODAL_TYPES: RecordType[] = ['breastfeed', 'bottle', 'pump'];

export const RECORD_TYPES: RecordType[] = ['breastfeed', 'bottle', 'pump', 'pee', 'poop', 'vomit'];

// ─── Relative time helper ───
export function getRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  if (isNaN(then)) return '-';
  const diffMs = now - then;
  if (diffMs < 0) return '방금 전'; // future record
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHr < 24) return `${diffHr}시간 전`;
  if (diffDay === 1) return '어제';
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}주 전`;
  return `${Math.floor(diffDay / 30)}개월 전`;
}

// ─── Shadow presets ───
export const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};
