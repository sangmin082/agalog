import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addRecord, getRecords } from '../storage';
import { RecordType, RecordEntry, RECORD_LABELS, RECORD_ICONS, RECORD_COLORS } from '../types';

const RECORD_TYPES: RecordType[] = ['breastfeed', 'bottle', 'pump', 'sleep', 'pee', 'poop', 'vomit'];

interface FormState {
  leftMinutes: string;
  rightMinutes: string;
  amountMl: string;
  note: string;
}

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmtSeconds(s: number) { return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`; }

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

export default function HomeScreen({ onRecordAdded }: { onRecordAdded: () => void }) {
  const [modal, setModal] = useState<RecordType | null>(null);
  const [form, setForm] = useState<FormState>({ leftMinutes: '', rightMinutes: '', amountMl: '', note: '' });
  const [sleeping, setSleeping] = useState(false);
  const [sleepSeconds, setSleepSeconds] = useState(0);
  const [sleepStart, setSleepStart] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [todayCounts, setTodayCounts] = useState<Partial<Record<RecordType, number>>>({});

  const loadCounts = useCallback(async () => {
    const records = await getRecords();
    setTodayCounts(getTodayCounts(records));
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  useEffect(() => {
    if (sleeping) {
      timerRef.current = setInterval(() => setSleepSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sleeping]);

  function resetForm() {
    setForm({ leftMinutes: '', rightMinutes: '', amountMl: '', note: '' });
  }

  async function handleSleepToggle() {
    if (!sleeping) {
      setSleepStart(new Date());
      setSleepSeconds(0);
      setSleeping(true);
    } else {
      setSleeping(false);
      const mins = Math.round(sleepSeconds / 60);
      const entry: RecordEntry = {
        id: Date.now().toString(),
        type: 'sleep',
        startTime: sleepStart!.toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes: mins,
      };
      await addRecord(entry);
      setSleepSeconds(0);
      setSleepStart(null);
      onRecordAdded();
      loadCounts();
      Alert.alert('😴 수면 기록 완료!', `총 ${mins}분 잤어요.`);
    }
  }

  async function handleSave() {
    if (!modal) return;
    const entry: RecordEntry = {
      id: Date.now().toString(),
      type: modal,
      startTime: new Date().toISOString(),
      ...(modal === 'breastfeed' && {
        leftMinutes: form.leftMinutes ? parseInt(form.leftMinutes) : undefined,
        rightMinutes: form.rightMinutes ? parseInt(form.rightMinutes) : undefined,
      }),
      ...((modal === 'bottle' || modal === 'pump') && {
        amountMl: form.amountMl ? parseFloat(form.amountMl) : undefined,
      }),
      note: form.note || undefined,
    };
    await addRecord(entry);
    setModal(null);
    resetForm();
    onRecordAdded();
    loadCounts();
    Alert.alert('✅ 기록 완료!', `${RECORD_LABELS[modal]} 기록이 저장됐어요.`);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>아가로그 🍼</Text>

        {/* 오늘 요약 */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>오늘 기록 요약</Text>
          <View style={styles.summaryRow}>
            {(['breastfeed', 'bottle', 'pee', 'poop', 'sleep'] as RecordType[]).map((type) => (
              <View key={type} style={styles.summaryItem}>
                <Text style={styles.summaryIcon}>{RECORD_ICONS[type]}</Text>
                <Text style={styles.summaryCount}>{todayCounts[type] ?? 0}</Text>
                <Text style={styles.summaryLabel}>{RECORD_LABELS[type]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 수면 타이머 */}
        <View style={[styles.sleepTimer, sleeping && styles.sleepTimerActive]}>
          <Text style={styles.sleepTimerLabel}>{sleeping ? '😴 수면 중...' : '😴 수면 기록'}</Text>
          {sleeping && <Text style={styles.sleepTimerCount}>{fmtSeconds(sleepSeconds)}</Text>}
          <TouchableOpacity
            style={[styles.sleepBtn, { backgroundColor: sleeping ? '#FF6B6B' : '#748FFC' }]}
            onPress={handleSleepToggle}
          >
            <Text style={styles.sleepBtnText}>{sleeping ? '⏹ 수면 종료' : '▶ 수면 시작'}</Text>
          </TouchableOpacity>
        </View>

        {/* 기록 버튼 그리드 */}
        <Text style={styles.sectionTitle}>기록하기</Text>
        <View style={styles.grid}>
          {RECORD_TYPES.filter((t) => t !== 'sleep').map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.card, { backgroundColor: RECORD_COLORS[type] }]}
              onPress={() => { setModal(type); resetForm(); }}
            >
              <Text style={styles.cardIcon}>{RECORD_ICONS[type]}</Text>
              <Text style={styles.cardLabel}>{RECORD_LABELS[type]}</Text>
              {(todayCounts[type] ?? 0) > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{todayCounts[type]}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {modal && (
              <>
                <Text style={styles.sheetTitle}>{RECORD_ICONS[modal]} {RECORD_LABELS[modal]} 기록</Text>
                {modal === 'breastfeed' && (
                  <>
                    <Text style={styles.label}>왼쪽 수유 시간 (분)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="0"
                      value={form.leftMinutes} onChangeText={(v) => setForm((f) => ({ ...f, leftMinutes: v }))} />
                    <Text style={styles.label}>오른쪽 수유 시간 (분)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="0"
                      value={form.rightMinutes} onChangeText={(v) => setForm((f) => ({ ...f, rightMinutes: v }))} />
                  </>
                )}
                {(modal === 'bottle' || modal === 'pump') && (
                  <>
                    <Text style={styles.label}>양 (ml)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="0"
                      value={form.amountMl} onChangeText={(v) => setForm((f) => ({ ...f, amountMl: v }))} />
                  </>
                )}
                <Text style={styles.label}>메모 (선택)</Text>
                <TextInput style={[styles.input, styles.inputNote]} placeholder="특이사항 입력"
                  value={form.note} onChangeText={(v) => setForm((f) => ({ ...f, note: v }))} multiline />
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: RECORD_COLORS[modal] }]} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>저장</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(null)}>
                  <Text style={styles.cancelBtnText}>취소</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  scroll: { paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: 16, marginBottom: 16, color: '#222' },
  summaryBox: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  summaryTitle: { fontSize: 13, color: '#999', fontWeight: '600', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', gap: 2 },
  summaryIcon: { fontSize: 24 },
  summaryCount: { fontSize: 20, fontWeight: '800', color: '#222' },
  summaryLabel: { fontSize: 10, color: '#999' },
  sleepTimer: { marginHorizontal: 16, backgroundColor: '#EEF0FF', borderRadius: 18, padding: 18, marginBottom: 16, alignItems: 'center' },
  sleepTimerActive: { backgroundColor: '#D0D7FF' },
  sleepTimerLabel: { fontSize: 16, fontWeight: '700', color: '#444', marginBottom: 8 },
  sleepTimerCount: { fontSize: 36, fontWeight: '800', color: '#748FFC', marginBottom: 12, letterSpacing: 2 },
  sleepBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 30 },
  sleepBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#666', marginLeft: 20, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, paddingHorizontal: 16 },
  card: { width: 148, height: 148, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  cardIcon: { fontSize: 44, marginBottom: 8 },
  cardLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  badge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20, color: '#222' },
  label: { fontSize: 13, color: '#666', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 10, padding: 12, fontSize: 16 },
  inputNote: { height: 80, textAlignVertical: 'top' },
  saveBtn: { marginTop: 24, padding: 16, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cancelBtn: { marginTop: 10, padding: 12, alignItems: 'center' },
  cancelBtnText: { color: '#888', fontSize: 15 },
});
