import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addRecord } from '../storage';
import {
  RecordType,
  RecordEntry,
  RECORD_LABELS,
  RECORD_ICONS,
  RECORD_COLORS,
} from '../types';

const RECORD_TYPES: RecordType[] = ['breastfeed', 'bottle', 'pump', 'pee', 'poop', 'vomit'];

interface FormState {
  leftMinutes: string;
  rightMinutes: string;
  amountMl: string;
  note: string;
}

export default function HomeScreen({ onRecordAdded }: { onRecordAdded: () => void }) {
  const [modal, setModal] = useState<RecordType | null>(null);
  const [form, setForm] = useState<FormState>({ leftMinutes: '', rightMinutes: '', amountMl: '', note: '' });

  function resetForm() {
    setForm({ leftMinutes: '', rightMinutes: '', amountMl: '', note: '' });
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
    Alert.alert('✅ 기록 완료!', `${RECORD_LABELS[modal]} 기록이 저장됐어요.`);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>아가로그 🍼</Text>
      <Text style={styles.subtitle}>오늘도 수고해요!</Text>

      <ScrollView contentContainerStyle={styles.grid}>
        {RECORD_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.card, { backgroundColor: RECORD_COLORS[type] }]}
            onPress={() => { setModal(type); resetForm(); }}
          >
            <Text style={styles.cardIcon}>{RECORD_ICONS[type]}</Text>
            <Text style={styles.cardLabel}>{RECORD_LABELS[type]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={!!modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {modal && (
              <>
                <Text style={styles.sheetTitle}>
                  {RECORD_ICONS[modal]} {RECORD_LABELS[modal]} 기록
                </Text>

                {modal === 'breastfeed' && (
                  <>
                    <Text style={styles.label}>왼쪽 수유 시간 (분)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="0"
                      value={form.leftMinutes}
                      onChangeText={(v) => setForm((f) => ({ ...f, leftMinutes: v }))}
                    />
                    <Text style={styles.label}>오른쪽 수유 시간 (분)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="0"
                      value={form.rightMinutes}
                      onChangeText={(v) => setForm((f) => ({ ...f, rightMinutes: v }))}
                    />
                  </>
                )}

                {(modal === 'bottle' || modal === 'pump') && (
                  <>
                    <Text style={styles.label}>양 (ml)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="0"
                      value={form.amountMl}
                      onChangeText={(v) => setForm((f) => ({ ...f, amountMl: v }))}
                    />
                  </>
                )}

                <Text style={styles.label}>메모 (선택)</Text>
                <TextInput
                  style={[styles.input, styles.inputNote]}
                  placeholder="특이사항 입력"
                  value={form.note}
                  onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
                  multiline
                />

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: RECORD_COLORS[modal] }]}
                  onPress={handleSave}
                >
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
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: 16, color: '#222' },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, paddingHorizontal: 16, paddingBottom: 32 },
  card: { width: 150, height: 150, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  cardIcon: { fontSize: 48, marginBottom: 8 },
  cardLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
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
