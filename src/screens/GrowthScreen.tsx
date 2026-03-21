import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getGrowthEntries, addGrowthEntry, deleteGrowthEntry } from '../storage';
import { GrowthEntry } from '../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function GrowthScreen() {
  const [entries, setEntries] = useState<GrowthEntry[]>([]);
  const [modal, setModal] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCm, setHeadCm] = useState('');

  const load = useCallback(async () => {
    const data = await getGrowthEntries();
    setEntries(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!weightKg && !heightCm && !headCm) {
      Alert.alert('입력 필요', '최소 하나의 값을 입력해주세요.');
      return;
    }
    const entry: GrowthEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      heightCm: heightCm ? parseFloat(heightCm) : undefined,
      headCm: headCm ? parseFloat(headCm) : undefined,
    };
    await addGrowthEntry(entry);
    setModal(false);
    setWeightKg(''); setHeightCm(''); setHeadCm('');
    load();
  }

  async function handleDelete(id: string) {
    Alert.alert('삭제', '이 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => { await deleteGrowthEntry(id); load(); } },
    ]);
  }

  const latest = entries[0];

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>성장 기록 📏</Text>

      {latest && (
        <View style={styles.latestBox}>
          <Text style={styles.latestLabel}>최근 측정</Text>
          <Text style={styles.latestDate}>{formatDate(latest.date)}</Text>
          <View style={styles.latestRow}>
            {latest.weightKg !== undefined && (
              <View style={styles.latestItem}>
                <Text style={styles.latestValue}>{latest.weightKg}<Text style={styles.latestUnit}>kg</Text></Text>
                <Text style={styles.latestKey}>몸무게</Text>
              </View>
            )}
            {latest.heightCm !== undefined && (
              <View style={styles.latestItem}>
                <Text style={styles.latestValue}>{latest.heightCm}<Text style={styles.latestUnit}>cm</Text></Text>
                <Text style={styles.latestKey}>키</Text>
              </View>
            )}
            {latest.headCm !== undefined && (
              <View style={styles.latestItem}>
                <Text style={styles.latestValue}>{latest.headCm}<Text style={styles.latestUnit}>cm</Text></Text>
                <Text style={styles.latestKey}>머리둘레</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
        <Text style={styles.addBtnText}>+ 오늘 성장 기록 추가</Text>
      </TouchableOpacity>

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>아직 성장 기록이 없어요</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowDate}>{formatDate(item.date)}</Text>
                <View style={styles.rowStats}>
                  {item.weightKg !== undefined && <Text style={styles.stat}>⚖️ {item.weightKg}kg</Text>}
                  {item.heightCm !== undefined && <Text style={styles.stat}>📏 {item.heightCm}cm</Text>}
                  {item.headCm !== undefined && <Text style={styles.stat}>🔵 머리 {item.headCm}cm</Text>}
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>삭제</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>📏 성장 기록 추가</Text>
            <Text style={styles.label}>몸무게 (kg)</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" placeholder="예: 4.5"
              value={weightKg} onChangeText={setWeightKg} />
            <Text style={styles.label}>키 (cm)</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" placeholder="예: 55.0"
              value={heightCm} onChangeText={setHeightCm} />
            <Text style={styles.label}>머리둘레 (cm)</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" placeholder="예: 37.5"
              value={headCm} onChangeText={setHeadCm} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>저장</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
              <Text style={styles.cancelBtnText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  title: { fontSize: 22, fontWeight: '800', margin: 16, color: '#222' },
  latestBox: { marginHorizontal: 16, backgroundColor: '#EEF0FF', borderRadius: 18, padding: 18, marginBottom: 12 },
  latestLabel: { fontSize: 12, color: '#888', fontWeight: '600' },
  latestDate: { fontSize: 13, color: '#555', marginBottom: 12 },
  latestRow: { flexDirection: 'row', gap: 24 },
  latestItem: { alignItems: 'center' },
  latestValue: { fontSize: 28, fontWeight: '800', color: '#748FFC' },
  latestUnit: { fontSize: 14, fontWeight: '400' },
  latestKey: { fontSize: 12, color: '#888', marginTop: 2 },
  addBtn: { marginHorizontal: 16, backgroundColor: '#748FFC', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 16 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  row: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  rowLeft: { flex: 1 },
  rowDate: { fontSize: 13, fontWeight: '700', color: '#222', marginBottom: 6 },
  rowStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { fontSize: 13, color: '#555' },
  deleteText: { color: '#FF6B6B', fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#aaa' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetTitle: { fontSize: 22, fontWeight: '800', marginBottom: 16, color: '#222' },
  label: { fontSize: 13, color: '#666', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 10, padding: 12, fontSize: 16 },
  saveBtn: { marginTop: 24, padding: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#748FFC' },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cancelBtn: { marginTop: 10, padding: 12, alignItems: 'center' },
  cancelBtnText: { color: '#888', fontSize: 15 },
});
