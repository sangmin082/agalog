import { RecordType } from './types';

// ─── Design System ─── Shared tokens for 아가로그
export const DS = {
  // Base colors
  bg: '#FFFFFF',
  bgSoft: '#F8F9FF',
  primary: '#7C6FF7',
  primaryLight: '#EEF0FF',

  // Text
  text: '#1A1A2E',
  textSub: '#6B7280',
  textLight: '#9CA3AF',

  // Radius
  radius: 20,
  radiusSm: 14,

  // Section header style
  sectionFontSize: 13,
  sectionLetterSpacing: 0.8,
};

export const CARD_THEME: Record<RecordType, { bg: string; accent: string; shadow: string }> = {
  breastfeed: { bg: '#FFF0F5', accent: '#FF6B9D', shadow: '#FF6B9D' },
  bottle:     { bg: '#EEF6FF', accent: '#4D9FEC', shadow: '#4D9FEC' },
  pump:       { bg: '#EDFBEE', accent: '#52C76A', shadow: '#52C76A' },
  pee:        { bg: '#FFFBEE', accent: '#F0B429', shadow: '#F0B429' },
  poop:       { bg: '#FEF5EE', accent: '#D4875E', shadow: '#D4875E' },
  vomit:      { bg: '#F5F0FF', accent: '#9B7FE8', shadow: '#9B7FE8' },
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
  const diffMs = now - then;
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

// ─── Section header styles (shared) ───
export const sectionHeaderStyle = {
  fontSize: DS.sectionFontSize,
  fontWeight: '700' as const,
  color: DS.textSub,
  textTransform: 'uppercase' as const,
  letterSpacing: DS.sectionLetterSpacing,
};
