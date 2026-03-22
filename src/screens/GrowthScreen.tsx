import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Modal, TextInput, Alert, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { getGrowthEntries, addGrowthEntry, deleteGrowthEntry } from '../storage';
import { GrowthEntry } from '../types';
import { DS } from '../theme';

const W = Dimensions.get('window').width;

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

type ChartTab = 'weight' | 'height' | 'head';

const CHART_TABS: { key: ChartTab; label: string; unit: string; color: string; bg: string }[] = [
  { key: 'weight', label: '몸무게', unit: 'kg', color: '#FF6B9D', bg: '#FFF0F5' },
  { key: 'height', label: '키',     unit: 'cm', color: '#4D9FEC', bg: '#EEF6FF' },
  { key: 'head',   label: '머리둘레', unit: 'cm', color: '#9B7FE8', bg: '#F5F0FF' },
];

export default function GrowthScreen() {
  const [entries, setEntries] = useState<GrowthEntry[]>([]);
  const [modal, setModal] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCm, setHeadCm] = useState('');
  const [chartTab, setChartTab] = useState<ChartTab>('weight');

  const load = useCallback(async () => { setEntries(await getGrowthEntries()); }, []);
  useEffect(() => { load(); }, [load]);

  const handleSave = useCallback(async () => {
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
  }, [weightKg, heightCm, headCm, load]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('삭제', '이 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => { await deleteGrowthEntry(id); load(); } },
    ]);
  }, [load]);

  const latest = entries[0];

  // Chart data — chronological order (oldest → newest)
  const chartData = useMemo(() => {
    const sorted = [...entries].reverse(); // oldest first
    const maxPoints = 8;
    const slice = sorted.slice(-maxPoints);
    if (slice.length < 2) return null;

    const tab = CHART_TABS.find((t) => t.key === chartTab)!;
    const values: number[] = slice.map((e) => {
      if (chartTab === 'weight') return e.weightKg ?? 0;
      if (chartTab === 'height') return e.heightCm ?? 0;
      return e.headCm ?? 0;
    });

    // Skip if all zeros
    if (values.every((v) => v === 0)) return null;

    return {
      labels: slice.map((e) => formatDate(e.date)),
      datasets: [{ data: values, strokeWidth: 2.5 }],
      color: tab.color,
      unit: tab.unit,
    };
  }, [entries, chartTab]);

  const CHART_CONFIG = useMemo(() => {
    const tab = CHART_TABS.find((t) => t.key === chartTab)!;
    return {
      backgroundGradientFrom: '#FFFFFF',
      backgroundGradientTo: '#FFFFFF',
      color: (opacity = 1) => tab.color + Math.round(opacity * 255).toString(16).padStart(2, '0'),
      labelColor: () => DS.textSub,
      strokeWidth: 2,
      decimalPlaces: 1,
      propsForDots: {
        r: '4',
        strokeWidth: '2',
        stroke: tab.color,
        fill: '#FFFFFF',
      },
    };
  }, [chartTab]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>성장 기록</Text>
          <Text style={styles.headerSub}>아기의 성장 곡선을 추적해요</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>추가</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.separator} />

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* Latest measurement hero */}
            {latest && (
              <>
                <Text style={styles.sectionTitle}>최근 측정</Text>
                <View style={styles.heroCard}>
                  <Text style={styles.heroDate}>{formatDateLong(latest.date)}</Text>
                  <View style={styles.heroRow}>
                    {latest.weightKg !== undefined && (
                      <View style={[styles.heroItem, { backgroundColor: '#FFF0F5' }]}>
                        <Ionicons name="scale-outline" size={22} color="#FF6B9D" />
                        <Text style={[styles.heroVal, { color: '#FF6B9D' }]}>{latest.weightKg}</Text>
                        <Text style={styles.heroUnit}>kg</Text>
                      </View>
                    )}
                    {latest.heightCm !== undefined && (
                      <View style={[styles.heroItem, { backgroundColor: '#EEF6FF' }]}>
                        <Ionicons name="resize-outline" size={22} color="#4D9FEC" />
                        <Text style={[styles.heroVal, { color: '#4D9FEC' }]}>{latest.heightCm}</Text>
                        <Text style={styles.heroUnit}>cm</Text>
                      </View>
                    )}
                    {latest.headCm !== undefined && (
                      <View style={[styles.heroItem, { backgroundColor: '#F5F0FF' }]}>
                        <Ionicons name="ellipse-outline" size={22} color="#9B7FE8" />
                        <Text style={[styles.heroVal, { color: '#9B7FE8' }]}>{latest.headCm}</Text>
                        <Text style={styles.heroUnit}>cm</Text>
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}

            {/* Growth Chart */}
            {entries.length >= 2 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>성장 곡선</Text>
                {/* Chart tab switcher */}
                <View style={styles.chartTabRow}>
                  {CHART_TABS.map((tab) => (
                    <TouchableOpacity
                      key={tab.key}
                      style={[
                        styles.chartTabBtn,
                        chartTab === tab.key && { backgroundColor: tab.color },
                      ]}
                      onPress={() => setChartTab(tab.key)}
                    >
                      <Text style={[
                        styles.chartTabText,
                        chartTab === tab.key && { color: '#fff' },
                      ]}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {chartData ? (
                  <View style={styles.chartCard}>
                    <LineChart
                      data={{ labels: chartData.labels, datasets: chartData.datasets }}
                      width={W - 48}
                      height={180}
                      chartConfig={CHART_CONFIG}
                      bezier
                      style={styles.chart}
                      withInnerLines={false}
                      withOuterLines={false}
                      withShadow={false}
                      formatYLabel={(y) => `${parseFloat(y).toFixed(1)}`}
                    />
                    <Text style={styles.chartUnit}>단위: {CHART_TABS.find((t) => t.key === chartTab)!.unit}</Text>
                  </View>
                ) : (
                  <View style={styles.chartEmpty}>
                    <Text style={styles.chartEmptyText}>이 항목의 데이터가 부족해요</Text>
                  </View>
                )}
              </>
            )}

            {/* List header */}
            {entries.length > 0 && (
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                전체 기록 ({entries.length}개)
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="analytics-outline" size={64} color={DS.textLight} />
            <Text style={styles.emptyTitle}>아직 성장 기록이 없어요</Text>
            <Text style={styles.emptyHint}>키, 몸무게, 머리둘레를 기록해보세요</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setModal(true)}>
              <Text style={styles.emptyBtnText}>첫 기록 추가하기</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <View style={styles.rowIdx}>
              <Text style={styles.rowIdxText}>{entries.length - index}</Text>
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowDate}>{formatDateLong(item.date)}</Text>
              <View style={styles.rowChips}>
                {item.weightKg !== undefined && (
                  <View style={[styles.rowChip, { backgroundColor: '#FFF0F5' }]}>
                    <Ionicons name="scale-outline" size={12} color="#FF6B9D" />
                    <Text style={[styles.rowChipText, { color: '#FF6B9D' }]}> {item.weightKg}kg</Text>
                  </View>
                )}
                {item.heightCm !== undefined && (
                  <View style={[styles.rowChip, { backgroundColor: '#EEF6FF' }]}>
                    <Ionicons name="resize-outline" size={12} color="#4D9FEC" />
                    <Text style={[styles.rowChipText, { color: '#4D9FEC' }]}> {item.heightCm}cm</Text>
                  </View>
                )}
                {item.headCm !== undefined && (
                  <View style={[styles.rowChip, { backgroundColor: '#F5F0FF' }]}>
                    <Ionicons name="ellipse-outline" size={12} color="#9B7FE8" />
                    <Text style={[styles.rowChipText, { color: '#9B7FE8' }]}> {item.headCm}cm</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color="#E5484D" />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Add Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.overlayTap} onStartShouldSetResponder={() => { setModal(false); return true; }} />
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.sheet}>
              <View style={styles.sheetStrip} />
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>성장 기록 추가</Text>

              {[
                { label: '몸무게 (kg)', icon: 'scale-outline' as const, color: '#FF6B9D', value: weightKg, setter: setWeightKg, placeholder: '예: 4.5' },
                { label: '키 (cm)', icon: 'resize-outline' as const, color: '#4D9FEC', value: heightCm, setter: setHeightCm, placeholder: '예: 55.0' },
                { label: '머리둘레 (cm)', icon: 'ellipse-outline' as const, color: '#9B7FE8', value: headCm, setter: setHeadCm, placeholder: '예: 37.5' },
              ].map(({ label, icon, color, value, setter, placeholder }) => (
                <View key={label}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <View style={styles.fieldRow}>
                    <Ionicons name={icon} size={20} color={color} style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.fieldInput}
                      keyboardType="decimal-pad"
                      placeholder={placeholder}
                      placeholderTextColor={DS.textLight}
                      value={value}
                      onChangeText={setter}
                    />
                  </View>
                </View>
              ))}

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
    paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  separator: { height: 1, backgroundColor: DS.primary + '12', marginHorizontal: 24, marginBottom: 4 },

  list: { paddingHorizontal: 24, paddingBottom: 40 },

  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: DS.textSub,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },

  // Hero
  heroCard: {
    backgroundColor: DS.bgSoft, borderRadius: 20, padding: 20, marginBottom: 8,
  },
  heroDate: { fontSize: 13, color: DS.textSub, marginBottom: 14 },
  heroRow: { flexDirection: 'row', gap: 10 },
  heroItem: {
    flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4,
  },
  heroVal: { fontSize: 26, fontWeight: '900' },
  heroUnit: { fontSize: 12, color: DS.textLight },

  // Chart
  chartTabRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chartTabBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, backgroundColor: DS.bgSoft,
  },
  chartTabText: { fontSize: 13, fontWeight: '700', color: DS.textSub },
  chartCard: {
    backgroundColor: DS.bgSoft, borderRadius: 20, padding: 16, marginBottom: 8, overflow: 'hidden',
  },
  chart: { borderRadius: 12, marginLeft: -10 },
  chartUnit: { fontSize: 11, color: DS.textLight, textAlign: 'right', marginTop: 4 },
  chartEmpty: {
    backgroundColor: DS.bgSoft, borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 8,
  },
  chartEmptyText: { color: DS.textLight, fontSize: 13 },

  // List
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
  rowChip: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    flexDirection: 'row', alignItems: 'center',
  },
  rowChipText: { fontSize: 12, fontWeight: '600' },
  deleteBtn: { padding: 8 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, color: DS.textSub, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  emptyHint: { fontSize: 13, color: DS.textLight, marginBottom: 24, textAlign: 'center' },
  emptyBtn: { backgroundColor: DS.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  overlayTap: { flex: 1 },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 0, paddingBottom: 44,
    overflow: 'hidden',
  },
  sheetStrip: { height: 3, width: '100%', backgroundColor: DS.primary },
  sheetHandle: {
    width: 48, height: 5, borderRadius: 3,
    backgroundColor: '#D1D5DB', alignSelf: 'center', marginTop: 10, marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: DS.text, marginBottom: 8 },
  fieldLabel: { fontSize: 13, color: DS.textSub, fontWeight: '600', marginBottom: 6, marginTop: 16 },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14,
    paddingHorizontal: 14, backgroundColor: DS.bgSoft,
  },
  fieldInput: { flex: 1, fontSize: 17, fontWeight: '600', color: DS.text, paddingVertical: 14 },
  saveBtn: { marginTop: 28, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: DS.primary },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  cancelBtn: { marginTop: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: DS.textSub, fontSize: 15 },
});
