import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getGrowthEntries, addGrowthEntry, deleteGrowthEntry } from '../storage';
import { GrowthEntry } from '../types';

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
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>성장 기록</Text>
            <Text style={styles.headerSub}>아가의 성장을 기록해요</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
            <Text style={styles.addBtnText}>+ 추가</Text>
          </TouchableOpacity>
        </View>

        {/* Hero latest stats */}
        {latest && (
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>최근 측정</Text>
            <Text style={styles.heroDate}>{formatDate(latest.date)}</Text>
            <View style={styles.heroRow}>
              {latest.weightKg !== undefined && (
                <View style={styles.heroItem}>
                  <Text style={styles.heroEmoji}>⚖️</Text>
                  <Text style={styles.heroValue}>{latest.weightKg}</Text>
                  <Text style={styles.heroUnit}>kg</Text>
                  <Text style={styles.heroKey}>몸무게</Text>
                </View>
              )}
              {latest.heightCm !== undefined && (
                <View style={styles.heroItem}>
                  <Text style={styles.heroEmoji}>📏</Text>
                  <Text style={styles.heroValue}>{latest.heightCm}</Text>
                  <Text style={styles.heroUnit}>cm</Text>
                  <Text style={styles.heroKey}>키</Text>
                </View>
              )}
              {latest.headCm !== undefined && (
                <View style={styles.heroItem}>
                  <Text style={styles.heroEmoji}>🔵</Text>
                  <Text style={styles.heroValue}>{latest.headCm}</Text>
                  <Text style={styles.heroUnit}>cm</Text>
                  <Text style={styles.heroKey}>머리둘레</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* List */}
      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📏</Text>
          <Text style={styles.emptyTitle}>아직 성장 기록이 없어요</Text>
          <Text style={styles.emptyHint}>상단의 + 추가 버튼을 눌러보세요!</Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setModal(true)}>
            <Text style={styles.emptyAddBtnText}>첫 기록 추가하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.listHeader}>전체 기록 ({entries.length}개)</Text>
          }
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <View style={styles.rowIndexBadge}>
                <Text style={styles.rowIndexText}>{entries.length - index}</Text>
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowDate}>{formatDate(item.date)}</Text>
                <View style={styles.rowStats}>
                  {item.weightKg !== undefined && (
                    <View style={styles.statChip}>
                      <Text style={styles.statChipIcon}>⚖️</Text>
                      <Text style={styles.statChipText}>{item.weightKg}kg</Text>
                    </View>
                  )}
                  {item.heightCm !== undefined && (
                    <View style={styles.statChip}>
                      <Text style={styles.statChipIcon}>📏</Text>
                      <Text style={styles.statChipText}>{item.heightCm}cm</Text>
                    </View>
                  )}
                  {item.headCm !== undefined && (
                    <View style={styles.statChip}>
                      <Text style={styles.statChipIcon}>🔵</Text>
                      <Text style={styles.statChipText}>{item.headCm}cm</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>삭제</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>📏  성장 기록 추가</Text>

            <Text style={styles.label}>몸무게 (kg)</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputPrefix}>⚖️</Text>
              <TextInput style={styles.input} keyboardType="decimal-pad" placeholder="예: 4.5"
                value={weightKg} onChangeText={setWeightKg} />
            </View>

            <Text style={styles.label}>키 (cm)</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputPrefix}>📏</Text>
              <TextInput style={styles.input} keyboardType="decimal-pad" placeholder="예: 55.0"
                value={heightCm} onChangeText={setHeightCm} />
            </View>

            <Text style={styles.label}>머리둘레 (cm)</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputPrefix}>🔵</Text>
              <TextInput style={styles.input} keyboardType="decimal-pad" placeholder="예: 37.5"
                value={headCm} onChangeText={setHeadCm} />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>저장하기</Text>
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
  safe: { flex: 1, backgroundColor: DS.bg },

  header: {
    backgroundColor: DS.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.70)', marginTop: 4 },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // Hero card
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: DS.radius.medium,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroDate: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 12, marginTop: 2 },
  heroRow: { flexDirection: 'row', gap: 20 },
  heroItem: { alignItems: 'center' },
  heroEmoji: { fontSize: 20, marginBottom: 4 },
  heroValue: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  heroUnit: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  heroKey: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  listHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: DS.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  row: {
    backgroundColor: DS.surface,
    borderRadius: DS.radius.medium,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#6C5CE7',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  rowIndexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowIndexText: { fontSize: 13, fontWeight: '800', color: DS.primary },
  rowContent: { flex: 1 },
  rowDate: { fontSize: 13, fontWeight: '700', color: DS.text, marginBottom: 8 },
  rowStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  statChipIcon: { fontSize: 13 },
  statChipText: { fontSize: 13, color: DS.text, fontWeight: '600' },
  deleteBtn: { padding: 8 },
  deleteText: { color: DS.danger, fontSize: 13, fontWeight: '600' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, color: DS.textMuted, fontWeight: '700', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: DS.textLight, marginBottom: 24 },
  emptyAddBtn: {
    backgroundColor: DS.primary,
    borderRadius: DS.radius.medium,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyAddBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

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
  sheetTitle: { fontSize: 22, fontWeight: '800', marginBottom: 16, color: DS.text },
  label: { fontSize: 13, color: DS.textMuted, marginBottom: 6, marginTop: 14, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8EAFF',
    borderRadius: DS.radius.small,
    paddingHorizontal: 12,
    backgroundColor: '#FAFBFF',
  },
  inputPrefix: { fontSize: 20, marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: DS.text, paddingVertical: 12 },
  saveBtn: { marginTop: 24, padding: 16, borderRadius: DS.radius.medium, alignItems: 'center', backgroundColor: DS.primary },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  cancelBtn: { marginTop: 10, padding: 12, alignItems: 'center' },
  cancelBtnText: { color: DS.textMuted, fontSize: 15 },
});
