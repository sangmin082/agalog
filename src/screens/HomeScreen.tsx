import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, TextInput, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addRecord, getRecords } from '../storage';
import { RecordType, RecordEntry, RECORD_LABELS, RECORD_ICONS } from '../types';

// ─── Premium Design Tokens ───
const DS = {
  bg: '#FFFFFF',
  bgSoft: '#F8F9FF',
  primary: '#7C6FF7',
  primaryLight: '#EEF0FF',
  text: '#1A1A2E',
  textSub: '#6B7280',
  textLight: '#9CA3AF',
  radius: 20,
  radiusSm: 14,
};

const CARD_THEME: Record<RecordType, { bg: string; accent: string }> = {
  breastfeed: { bg: '#FFF0F5', accent: '#FF6B9D' },
  bottle:     { bg: '#EEF6FF', accent: '#4D9FEC' },
  pump:       { bg: '#EDFBEE', accent: '#52C76A' },
  pee:        { bg: '#FFFBEE', accent: '#F0B429' },
  poop:       { bg: '#FEF5EE', accent: '#D4875E' },
  vomit:      { bg: '#F5F0FF', accent: '#9B7FE8' },
};

const RECORD_TYPES: RecordType[] = ['breastfeed', 'bottle', 'pump', 'pee', 'poop', 'vomit'];

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function parseTimeToISO(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  if (!isNaN(h) && !isNaN(m)) d.setHours(h, m, 0, 0);
  return d.toISOString();
}

interface FormState {
  time: string;
  leftMinutes: string;
  rightMinutes: string;
  amountMl: string;
  pumpDuration: string;
  note: string;
}

function getTodayCounts(records: RecordEntry[]): Partial<Record<RecordType, number>> {
  const today = new Date().toDateString();
  const counts: Partial<Record<RecordType, number>> = {};
  for (const r of records) {
    if (new Date(r.startTime).toDateString() === today) {
      counts[r.type] = (counts[r.type] ?? 0) + 1;
    }
  }
  return counts;
}

function getTodayDate(): string {
  const d = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

export default function HomeScreen({ onRecordAdded }: { onRecordAdded: () => void }) {
  const [modal, setModal] = useState<RecordType | null>(null);
  const [form, setForm] = useState<FormState>({
    time: nowHHMM(), leftMinutes: '', rightMinutes: '', amountMl: '', pumpDuration: '', note: '',
  });
  const [todayCounts, setTodayCounts] = useState<Partial<Record<RecordType, number>>>({});

  const loadCounts = useCallback(async () => {
    const records = await getRecords();
    setTodayCounts(getTodayCounts(records));
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  function openModal(type: RecordType) {
    setModal(type);
    setForm({ time: nowHHMM(), leftMinutes: '', rightMinutes: '', amountMl: '', pumpDuration: '', note: '' });
  }

  async function handleSave() {
    if (!modal) return;
    if (!/^\d{1,2}:\d{2}$/.test(form.time)) {
      Alert.alert('시간 형식 오류', 'HH:MM 형식으로 입력해주세요.');
      return;
    }
    const entry: RecordEntry = {
      id: Date.now().toString(),
      type: modal,
      startTime: parseTimeToISO(form.time),
      ...(modal === 'breastfeed' && {
        leftMinutes: form.leftMinutes ? parseInt(form.leftMinutes) : undefined,
        rightMinutes: form.rightMinutes ? parseInt(form.rightMinutes) : undefined,
      }),
      ...(modal === 'bottle' && { amountMl: form.amountMl ? parseFloat(form.amountMl) : undefined }),
      ...(modal === 'pump' && {
        amountMl: form.amountMl ? parseFloat(form.amountMl) : undefined,
        durationMinutes: form.pumpDuration ? parseInt(form.pumpDuration) : undefined,
      }),
      note: form.note || undefined,
    };
    await addRecord(entry);
    setModal(null);
    onRecordAdded();
    loadCounts();
    Alert.alert('기록 완료', `${RECORD_LABELS[modal]} 기록이 저장됐어요.`);
  }

  const totalToday = RECORD_TYPES.reduce((sum, t) => sum + (todayCounts[t] ?? 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Clean White Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>안녕하세요!</Text>
            <Text style={styles.headerTitle}>아가로그</Text>
            <Text style={styles.headerDate}>{getTodayDate()}</Text>
          </View>
          <View style={styles.countBadgeOuter}>
            <View style={styles.countBadge}>
              <Text style={styles.countNum}>{totalToday}</Text>
            </View>
            <Text style={styles.countLabel}>오늘 기록</Text>
          </View>
        </View>

        {/* ── Summary Chips ── */}
        <View style={styles.chipSection}>
          <View style={styles.sectionRowChip}>
            <Text style={styles.sectionTitle}>오늘 요약</Text>
            <View style={styles.sectionLineChip} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {RECORD_TYPES.map((type) => {
              const theme = CARD_THEME[type];
              const count = todayCounts[type] ?? 0;
              return (
                <View key={type} style={[styles.chip, { backgroundColor: theme.bg, borderColor: count > 0 ? theme.accent : 'transparent' }]}>
                  <Text style={styles.chipIcon}>{RECORD_ICONS[type]}</Text>
                  <Text style={[styles.chipCount, { color: theme.accent }]}>{count}</Text>
                  <Text style={styles.chipLabel}>{RECORD_LABELS[type]}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Record Grid ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle2}>기록하기</Text>
          <View style={styles.sectionLine} />
        </View>
        <View style={styles.grid}>
          {RECORD_TYPES.map((type) => {
            const theme = CARD_THEME[type];
            const count = todayCounts[type] ?? 0;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.card, { backgroundColor: theme.bg }]}
                onPress={() => openModal(type)}
                activeOpacity={0.7}
              >
                {/* Accent strip at top */}
                <View style={[styles.cardAccent, { backgroundColor: theme.accent + '30' }]} />
                {count > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                    <Text style={styles.badgeText}>{count}</Text>
                  </View>
                )}
                <Text style={styles.cardIcon}>{RECORD_ICONS[type]}</Text>
                <Text style={[styles.cardLabel, { color: theme.accent }]}>{RECORD_LABELS[type]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Bottom Sheet Modal ── */}
      <Modal visible={!!modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.overlayTap} onStartShouldSetResponder={() => { setModal(null); return true; }} />
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.sheetScroll}>
            <View style={styles.sheet}>
              {modal && (
                <>
                  <View style={styles.sheetHandle} />
                  <View style={styles.sheetHeader}>
                    <Text style={styles.sheetEmoji}>{RECORD_ICONS[modal]}</Text>
                    <Text style={styles.sheetTitle}>{RECORD_LABELS[modal]} 기록</Text>
                  </View>

                  {/* Time */}
                  <Text style={styles.fieldLabel}>시간</Text>
                  <View style={[styles.fieldRow, { borderColor: CARD_THEME[modal].accent + '40' }]}>
                    <Text style={styles.fieldPrefix}>🕐</Text>
                    <TextInput
                      style={styles.fieldInput}
                      keyboardType="numbers-and-punctuation"
                      placeholder="14:30"
                      placeholderTextColor={DS.textLight}
                      value={form.time}
                      onChangeText={(v) => setForm((f) => ({ ...f, time: v }))}
                    />
                  </View>

                  {modal === 'breastfeed' && (
                    <View style={styles.row2}>
                      <View style={styles.half}>
                        <Text style={styles.fieldLabel}>왼쪽 (분)</Text>
                        <View style={[styles.fieldRow, { borderColor: CARD_THEME[modal].accent + '40' }]}>
                          <Text style={styles.fieldPrefix}>⬅️</Text>
                          <TextInput style={styles.fieldInput} keyboardType="numeric" placeholder="0" placeholderTextColor={DS.textLight}
                            value={form.leftMinutes} onChangeText={(v) => setForm((f) => ({ ...f, leftMinutes: v }))} />
                        </View>
                      </View>
                      <View style={styles.half}>
                        <Text style={styles.fieldLabel}>오른쪽 (분)</Text>
                        <View style={[styles.fieldRow, { borderColor: CARD_THEME[modal].accent + '40' }]}>
                          <Text style={styles.fieldPrefix}>➡️</Text>
                          <TextInput style={styles.fieldInput} keyboardType="numeric" placeholder="0" placeholderTextColor={DS.textLight}
                            value={form.rightMinutes} onChangeText={(v) => setForm((f) => ({ ...f, rightMinutes: v }))} />
                        </View>
                      </View>
                    </View>
                  )}

                  {modal === 'bottle' && (
                    <>
                      <Text style={styles.fieldLabel}>수유량 (ml)</Text>
                      <View style={[styles.fieldRow, { borderColor: CARD_THEME[modal].accent + '40' }]}>
                        <Text style={styles.fieldPrefix}>🍼</Text>
                        <TextInput style={styles.fieldInput} keyboardType="numeric" placeholder="0" placeholderTextColor={DS.textLight}
                          value={form.amountMl} onChangeText={(v) => setForm((f) => ({ ...f, amountMl: v }))} />
                      </View>
                    </>
                  )}

                  {modal === 'pump' && (
                    <View style={styles.row2}>
                      <View style={styles.half}>
                        <Text style={styles.fieldLabel}>유축량 (ml)</Text>
                        <View style={[styles.fieldRow, { borderColor: CARD_THEME[modal].accent + '40' }]}>
                          <Text style={styles.fieldPrefix}>🏺</Text>
                          <TextInput style={styles.fieldInput} keyboardType="numeric" placeholder="0" placeholderTextColor={DS.textLight}
                            value={form.amountMl} onChangeText={(v) => setForm((f) => ({ ...f, amountMl: v }))} />
                        </View>
                      </View>
                      <View style={styles.half}>
                        <Text style={styles.fieldLabel}>시간 (분)</Text>
                        <View style={[styles.fieldRow, { borderColor: CARD_THEME[modal].accent + '40' }]}>
                          <Text style={styles.fieldPrefix}>⏱️</Text>
                          <TextInput style={styles.fieldInput} keyboardType="numeric" placeholder="0" placeholderTextColor={DS.textLight}
                            value={form.pumpDuration} onChangeText={(v) => setForm((f) => ({ ...f, pumpDuration: v }))} />
                        </View>
                      </View>
                    </View>
                  )}

                  <Text style={styles.fieldLabel}>메모 (선택)</Text>
                  <View style={[styles.fieldRow, styles.fieldRowNote, { borderColor: CARD_THEME[modal].accent + '40' }]}>
                    <Text style={[styles.fieldPrefix, { alignSelf: 'flex-start', marginTop: 12 }]}>✏️</Text>
                    <TextInput
                      style={[styles.fieldInput, { height: 72, textAlignVertical: 'top' }]}
                      placeholder="특이사항 입력"
                      placeholderTextColor={DS.textLight}
                      value={form.note}
                      onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
                      multiline
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: CARD_THEME[modal].accent }]}
                    onPress={handleSave}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.saveBtnText}>저장하기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(null)}>
                    <Text style={styles.cancelBtnText}>취소</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.bg },
  scroll: { paddingBottom: 40 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: DS.primary + '12',
    marginBottom: 4,
  },
  headerLeft: {},
  greeting: { fontSize: 14, color: DS.textSub, fontWeight: '500', marginBottom: 4 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: DS.text, letterSpacing: -0.3 },
  headerDate: { fontSize: 13, color: DS.textLight, marginTop: 6 },
  countBadgeOuter: { alignItems: 'center' },
  countBadge: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: DS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: DS.primary, shadowOpacity: 0.3, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  countNum: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', lineHeight: 26 },
  countLabel: { fontSize: 10, color: DS.textSub, fontWeight: '600', marginTop: 4 },

  // ── Chips ──
  chipSection: { marginBottom: 20, marginTop: 4 },
  sectionRowChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, marginBottom: 12, gap: 12,
  },
  sectionLineChip: {
    flex: 1, height: 1, backgroundColor: DS.primary + '15',
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '800', color: DS.text,
    letterSpacing: 0.3,
  },
  chipScroll: { paddingLeft: 24, paddingRight: 12, gap: 10 },
  chip: {
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', borderWidth: 1.5, minWidth: 68,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  chipIcon: { fontSize: 20, marginBottom: 3 },
  chipCount: { fontSize: 20, fontWeight: '900', lineHeight: 24 },
  chipLabel: { fontSize: 10, color: DS.textSub, fontWeight: '600', marginTop: 2 },

  // ── Grid ──
  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, marginBottom: 14, gap: 12,
  },
  sectionTitle2: {
    fontSize: 15, fontWeight: '800', color: DS.text,
    letterSpacing: 0.3,
  },
  sectionLine: {
    flex: 1, height: 1, backgroundColor: DS.primary + '15',
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', paddingHorizontal: 24,
  },
  card: {
    width: 165, height: 120, borderRadius: DS.radius,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardIcon: { fontSize: 38 },
  cardAccent: {
    position: 'absolute', top: 0, left: 20, right: 20,
    height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3,
  },
  cardLabel: { fontWeight: '800', fontSize: 14, marginTop: 8, letterSpacing: 0.3 },
  badge: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

  // ── Modal ──
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  overlayTap: { flex: 1 },
  sheetScroll: {},
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 44,
  },
  sheetHandle: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 10 },
  sheetEmoji: { fontSize: 28 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: DS.text },

  fieldLabel: { fontSize: 13, color: DS.textSub, fontWeight: '600', marginBottom: 6, marginTop: 16 },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: DS.radiusSm,
    paddingHorizontal: 14, backgroundColor: DS.bgSoft,
  },
  fieldRowNote: { alignItems: 'flex-start' },
  fieldPrefix: { fontSize: 18, marginRight: 10 },
  fieldInput: { flex: 1, fontSize: 17, fontWeight: '600', color: DS.text, paddingVertical: 14 },

  row2: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },

  saveBtn: {
    marginTop: 28, paddingVertical: 16, borderRadius: 16, alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  cancelBtn: { marginTop: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: DS.textSub, fontSize: 15, fontWeight: '500' },
});
