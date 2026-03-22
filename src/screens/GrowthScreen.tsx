import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getGrowthEntries, addGrowthEntry, deleteGrowthEntry } from '../storage';
import { GrowthEntry } from '../types';

const DS = {
  bg: '#FFFFFF',
  bgSoft: '#F8F9FF',
  primary: '#7C6FF7',
  primaryLight: '#EEF0FF',
  text: '#1A1A2E',
  textSub: '#6B7280',
  textLight: '#9CA3AF',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function GrowthScreen() {
  const [entries, setEntries] = useState<GrowthEntry[]>([]);
  const [modal, setModal] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCm, setHeadCm] = useState('');

  const load = useCallback(async () => { setEntries(await getGrowthEntries()); }, []);
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
        <View>
          <Text style={styles.headerTitle}>성장</Text>
          <Text style={styles.headerSub}>아가의 성장을 기록해요</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Text style={styles.addBtnText}>+ 추가</Text>
        </TouchableOpacity>
      </View>

      {/* Latest measurement hero */}
      {latest && (
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>최근 측정</Text>
          <Text style={styles.heroDate}>{formatDate(latest.date)}</Text>
          <View style={styles.heroRow}>
            {latest.weightKg !== undefined && (
              <View style={[styles.heroItem, { backgroundColor: '#FFF0F5' }]}>
                <Text style={styles.heroEmoji}>⚖️</Text>
                <Text style={[styles.heroVal, { color: '#FF6B9D' }]}>{latest.weightKg}</Text>
                <Text style={styles.heroUnit}>kg</Text>
              </View>
            )}
            {latest.heightCm !== undefined && (
              <View style={[styles.heroItem, { backgroundColor: '#EEF6FF' }]}>
                <Text style={styles.heroEmoji}>📏</Text>
                <Text style={[styles.heroVal, { color: '#4D9FEC' }]}>{latest.heightCm}</Text>
                <Text style={styles.heroUnit}>cm</Text>
              </View>
            )}
            {latest.headCm !== undefined && (
              <View style={[styles.heroItem, { backgroundColor: '#F5F0FF' }]}>
                <Text style={styles.heroEmoji}>🔵</Text>
                <Text style={[styles.heroVal, { color: '#9B7FE8' }]}>{latest.headCm}</Text>
                <Text style={styles.heroUnit}>cm</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* List */}
      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📏</Text>
          <Text style={styles.emptyTitle}>아직 성장 기록이 없어요</Text>
          <Text style={styles.emptyHint}>상단의 + 추가 버튼을 눌러보세요!</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setModal(true)}>
            <Text style={styles.emptyBtnText}>첫 기록 추가하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.listLabel}>전체 기록 ({entries.length}개)</Text>
          }
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <View style={styles.rowIdx}>
                <Text style={styles.rowIdxText}>{entries.length - index}</Text>
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowDate}>{formatDate(item.date)}</Text>
                <View style={styles.rowChips}>
                  {item.weightKg !== undefined && (
                    <View style={[styles.rowChip, { backgroundColor: '#FFF0F5' }]}>
                      <Text style={styles.rowChipText}>⚖️ {item.weightKg}kg</Text>
                    </View>
                  )}
                  {item.heightCm !== undefined && (
                    <View style={[styles.rowChip, { backgroundColor: '#EEF6FF' }]}>
                      <Text style={styles.rowChipText}>📏 {item.heightCm}cm</Text>
                    </View>
                  )}
                  {item.headCm !== undefined && (
                    <View style={[styles.rowChip, { backgroundColor: '#F5F0FF' }]}>
                      <Text style={styles.rowChipText}>🔵 {item.headCm}cm</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 8 }}>
                <Text style={styles.deleteText}>삭제</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.overlayTap} onStartShouldSetResponder={() => { setModal(false); return true; }} />
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>📏 성장 기록 추가</Text>

              <Text style={styles.fieldLabel}>몸무게 (kg)</Text>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldPrefix}>⚖️</Text>
                <TextInput style={styles.fieldInput} keyboardType="decimal-pad" placeholder="예: 4.5"
                  placeholderTextColor={DS.textLight} value={weightKg} onChangeText={setWeightKg} />
              </View>

              <Text style={styles.fieldLabel}>키 (cm)</Text>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldPrefix}>📏</Text>
                <TextInput style={styles.fieldInput} keyboardType="decimal-pad" placeholder="예: 55.0"
                  placeholderTextColor={DS.textLight} value={heightCm} onChangeText={setHeightCm} />
              </View>

              <Text style={styles.fieldLabel}>머리둘레 (cm)</Text>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldPrefix}>🔵</Text>
                <TextInput style={styles.fieldInput} keyboardType="decimal-pad" placeholder="예: 37.5"
                  placeholderTextColor={DS.textLight} value={headCm} onChangeText={setHeadCm} />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>저장하기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.bg },

  header: {
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: DS.text },
  headerSub: { fontSize: 13, color: DS.textLight, marginTop: 4 },
  addBtn: {
    backgroundColor: DS.primary, borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // Hero
  heroCard: {
    marginHorizontal: 24, marginBottom: 20,
    backgroundColor: DS.bgSoft, borderRadius: 20, padding: 20,
  },
  heroLabel: {
    fontSize: 11, color: DS.textLight, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  heroDate: { fontSize: 14, color: DS.textSub, marginTop: 4, marginBottom: 16 },
  heroRow: { flexDirection: 'row', gap: 12 },
  heroItem: {
    flex: 1, borderRadius: 16, padding: 14, alignItems: 'center',
  },
  heroEmoji: { fontSize: 22, marginBottom: 6 },
  heroVal: { fontSize: 28, fontWeight: '900' },
  heroUnit: { fontSize: 12, color: DS.textLight, marginTop: 2 },

  // List
  listLabel: {
    fontSize: 13, fontWeight: '700', color: DS.textSub,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  row: {
    backgroundColor: DS.bgSoft, borderRadius: 16,
    padding: 14, flexDirection: 'row', alignItems: 'center',
    marginBottom: 10,
  },
  rowIdx: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: DS.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  rowIdxText: { fontSize: 13, fontWeight: '800', color: DS.primary },
  rowContent: { flex: 1 },
  rowDate: { fontSize: 13, fontWeight: '700', color: DS.text, marginBottom: 8 },
  rowChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rowChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  rowChipText: { fontSize: 13, color: DS.text, fontWeight: '600' },
  deleteText: { color: '#E5484D', fontSize: 13, fontWeight: '600' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, color: DS.textSub, fontWeight: '700', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: DS.textLight, marginBottom: 24 },
  emptyBtn: { backgroundColor: DS.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  overlayTap: { flex: 1 },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 44,
  },
  sheetHandle: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: DS.text, marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: DS.textSub, fontWeight: '600', marginBottom: 6, marginTop: 16 },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14,
    paddingHorizontal: 14, backgroundColor: DS.bgSoft,
  },
  fieldPrefix: { fontSize: 18, marginRight: 10 },
  fieldInput: { flex: 1, fontSize: 17, fontWeight: '600', color: DS.text, paddingVertical: 14 },
  saveBtn: { marginTop: 28, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: DS.primary },
  saveBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  cancelBtn: { marginTop: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: DS.textSub, fontSize: 15, fontWeight: '500' },
});
