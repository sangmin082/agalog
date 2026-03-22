import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addRecord, getRecords } from '../storage';
import { RecordType, RecordEntry, RECORD_LABELS, RECORD_ICONS, RECORD_COLORS } from '../types';

const DS = {
  bg: '#F7F8FF',
  primary: '#6C5CE7',
  secondary: '#A29BFE',
  surface: '#FFFFFF',
  danger: '#FF7675',
  success: '#00B894',
  text: '#2D3436',
  textMuted: '#636E72',
  textLight: '#B2BEC3',
  radius: { large: 24, medium: 16, small: 12 },
  shadow: { shadowColor: '#6C5CE7', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
};

const RECORD_TYPES: RecordType[] = ['breastfeed', 'bottle', 'pump', 'pee', 'poop', 'vomit'];

const CARD_BG: Record<RecordType, string> = {
  breastfeed: '#FF8FAB',
  bottle: '#5B9CF6',
  pump: '#6BC46A',
  pee: '#F6C644',
  poop: '#B07D52',
  vomit: '#9B8EC4',
};

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function parseTimeToISO(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  if (!isNaN(h) && !isNaN(m)) {
    d.setHours(h, m, 0, 0);
  }
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
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
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
      Alert.alert('시간 형식 오류', 'HH:MM 형식으로 입력해주세요. 예: 14:30');
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
      ...(modal === 'bottle' && {
        amountMl: form.amountMl ? parseFloat(form.amountMl) : undefined,
      }),
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
    Alert.alert('✅ 기록 완료!', `${RECORD_LABELS[modal]} 기록이 저장됐어요.`);
  }

  const totalToday = RECORD_TYPES.reduce((sum, t) => sum + (todayCounts[t] ?? 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {/* Decorative circles */}
          <View style={styles.headerCircle1} />
          <View style={styles.headerCircle2} />
          <View style={styles.headerLeft}>
            <Text style={styles.headerGreeting}>안녕하세요! 👋</Text>
            <Text style={styles.headerTitle}>아가로그 🍼</Text>
            <Text style={styles.headerDate}>{getTodayDate()}</Text>
          </View>
          <View style={styles.headerBadgeBox}>
            <Text style={styles.headerBadgeNum}>{totalToday}</Text>
            <Text style={styles.headerBadgeLabel}>오늘 기록</Text>
          </View>
        </View>

        {/* Summary chips horizontal scroll */}
        <View style={styles.summarySection}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>오늘 요약</Text>
            <Text style={styles.scrollHint}>총 {RECORD_TYPES.reduce((s, t) => s + (todayCounts[t] ?? 0), 0)}건</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {RECORD_TYPES.map((type) => (
              <View key={type} style={[styles.chip, { borderColor: CARD_BG[type] }]}>
                <Text style={styles.chipIcon}>{RECORD_ICONS[type]}</Text>
                <Text style={[styles.chipCount, { color: CARD_BG[type] }]}>{todayCounts[type] ?? 0}</Text>
                <Text style={styles.chipLabel}>{RECORD_LABELS[type]}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Record grid */}
        <Text style={styles.sectionLabel2}>기록하기</Text>
        <View style={styles.grid}>
          {RECORD_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.card, { backgroundColor: CARD_BG[type] }]}
              onPress={() => openModal(type)}
              activeOpacity={0.82}
            >
              {/* Count badge top-right */}
              {(todayCounts[type] ?? 0) > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{todayCounts[type]}</Text>
                </View>
              )}
              {/* Subtle dark overlay for bottom label area */}
              <View style={styles.cardSheen} />
              {/* Icon centered-top */}
              <View style={styles.cardIconWrap}>
                <Text style={styles.cardIcon}>{RECORD_ICONS[type]}</Text>
              </View>
              {/* Label bottom */}
              <View style={styles.cardBottom}>
                <Text style={styles.cardLabel}>{RECORD_LABELS[type]}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={!!modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.sheet}>
              {modal && (
                <>
                  {/* Sheet handle */}
                  <View style={styles.sheetHandle} />
                  <Text style={styles.sheetTitle}>
                    {RECORD_ICONS[modal]}  {RECORD_LABELS[modal]} 기록
                  </Text>

                  {/* Time input row */}
                  <Text style={styles.label}>언제 했나요?</Text>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeIcon}>🕐</Text>
                    <TextInput
                      style={styles.timeInput}
                      keyboardType="numbers-and-punctuation"
                      placeholder="14:30"
                      value={form.time}
                      onChangeText={(v) => setForm((f) => ({ ...f, time: v }))}
                    />
                  </View>

                  {modal === 'breastfeed' && (
                    <View style={styles.rowInputs}>
                      <View style={styles.halfInput}>
                        <Text style={styles.label}>왼쪽 (분)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" placeholder="0"
                          value={form.leftMinutes} onChangeText={(v) => setForm((f) => ({ ...f, leftMinutes: v }))} />
                      </View>
                      <View style={styles.halfInput}>
                        <Text style={styles.label}>오른쪽 (분)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" placeholder="0"
                          value={form.rightMinutes} onChangeText={(v) => setForm((f) => ({ ...f, rightMinutes: v }))} />
                      </View>
                    </View>
                  )}

                  {modal === 'bottle' && (
                    <>
                      <Text style={styles.label}>수유량 (ml)</Text>
                      <TextInput style={styles.input} keyboardType="numeric" placeholder="0"
                        value={form.amountMl} onChangeText={(v) => setForm((f) => ({ ...f, amountMl: v }))} />
                    </>
                  )}

                  {modal === 'pump' && (
                    <View style={styles.rowInputs}>
                      <View style={styles.halfInput}>
                        <Text style={styles.label}>유축량 (ml)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" placeholder="0"
                          value={form.amountMl} onChangeText={(v) => setForm((f) => ({ ...f, amountMl: v }))} />
                      </View>
                      <View style={styles.halfInput}>
                        <Text style={styles.label}>유축 시간 (분)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" placeholder="0"
                          value={form.pumpDuration} onChangeText={(v) => setForm((f) => ({ ...f, pumpDuration: v }))} />
                      </View>
                    </View>
                  )}

                  <Text style={styles.label}>메모 (선택)</Text>
                  <TextInput style={[styles.input, styles.inputNote]} placeholder="특이사항 입력"
                    value={form.note} onChangeText={(v) => setForm((f) => ({ ...f, note: v }))} multiline />

                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: CARD_BG[modal] }]} onPress={handleSave}>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DS.primary,
    marginHorizontal: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 20,
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -30,
    right: 80,
  },
  headerCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -20,
    right: 20,
  },
  headerLeft: { flex: 1 },
  headerGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginBottom: 4 },
  headerTitle: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, lineHeight: 36 },
  headerDate: { fontSize: 13, color: 'rgba(255,255,255,0.70)', marginTop: 4 },
  headerBadgeBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: DS.radius.medium,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerBadgeNum: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', lineHeight: 36 },
  headerBadgeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 3, fontWeight: '600' },

  // Summary chips
  summarySection: { marginBottom: 20 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 10 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: DS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  scrollHint: { fontSize: 12, color: DS.primary, fontWeight: '700' },
  sectionLabel2: { fontSize: 13, fontWeight: '700', color: DS.textMuted, marginLeft: 20, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipsRow: { paddingLeft: 20, paddingRight: 10, gap: 10 },
  chip: {
    backgroundColor: DS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    minWidth: 68,
    shadowColor: '#6C5CE7',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  chipIcon: { fontSize: 20, marginBottom: 3 },
  chipCount: { fontSize: 20, fontWeight: '800' },
  chipLabel: { fontSize: 10, color: DS.textMuted, marginTop: 1, fontWeight: '600' },

  // Grid cards
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingHorizontal: 16 },
  card: {
    width: 155,
    height: 145,
    borderRadius: DS.radius.large,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 5,
  },
  cardSheen: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 46,
    backgroundColor: 'rgba(0,0,0,0.33)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  cardIconWrap: {
    position: 'absolute',
    top: 0,
    bottom: 46,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: { fontSize: 54 },
  cardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 10,
  },
  badgeText: { color: DS.text, fontSize: 13, fontWeight: '800' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: DS.surface,
    borderTopLeftRadius: DS.radius.large,
    borderTopRightRadius: DS.radius.large,
    padding: 24,
    paddingBottom: 44,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20, color: DS.text },
  label: { fontSize: 13, color: DS.textMuted, marginBottom: 6, marginTop: 14, fontWeight: '600' },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: DS.secondary,
    borderRadius: DS.radius.small,
    paddingHorizontal: 12,
    backgroundColor: '#F7F8FF',
  },
  timeIcon: { fontSize: 20, marginRight: 10 },
  timeInput: { flex: 1, fontSize: 20, fontWeight: '700', color: DS.primary, paddingVertical: 12 },
  rowInputs: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E8EAFF',
    borderRadius: DS.radius.small,
    padding: 12,
    fontSize: 16,
    color: DS.text,
    backgroundColor: '#FAFBFF',
  },
  inputNote: { height: 80, textAlignVertical: 'top' },
  saveBtn: { marginTop: 24, padding: 16, borderRadius: DS.radius.medium, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  cancelBtn: { marginTop: 10, padding: 12, alignItems: 'center' },
  cancelBtnText: { color: DS.textMuted, fontSize: 15 },
});
