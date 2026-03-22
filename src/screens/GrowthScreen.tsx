import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Modal, TextInput, Alert, ScrollView, Dimensions, Platform, ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import * as ImagePicker from 'expo-image-picker';
import { getGrowthEntries, addGrowthEntry, deleteGrowthEntry } from '../storage';
import { GrowthEntry } from '../types';
import { DS, cardShadow } from '../theme';
import { extractGrowthFromImage, getGeminiApiKey, saveGeminiApiKey } from '../utils/ocrGrowth';

const W = Dimensions.get('window').width;

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

type ChartTab = 'weight' | 'height' | 'head';

const CHART_TABS: { key: ChartTab; label: string; unit: string; color: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'weight', label: '몸무게', unit: 'kg', color: '#E5484D', icon: 'scale-outline' },
  { key: 'height', label: '키',     unit: 'cm', color: '#3E63DD', icon: 'resize-outline' },
  { key: 'head',   label: '머리둘레', unit: 'cm', color: '#8E4EC6', icon: 'ellipse-outline' },
];

export default function GrowthScreen() {
  const [entries, setEntries] = useState<GrowthEntry[]>([]);
  const [modal, setModal] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCm, setHeadCm] = useState('');
  const [entryDate, setEntryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [chartTab, setChartTab] = useState<ChartTab>('weight');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [apiKeyModal, setApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const load = useCallback(async () => { setEntries(await getGrowthEntries()); }, []);
  useEffect(() => { load(); }, [load]);

  const handleOcrPhoto = useCallback(async () => {
    // Check API key
    let apiKey = await getGeminiApiKey();
    if (!apiKey) {
      setApiKeyModal(true);
      return;
    }

    // Request camera/gallery permission & pick image
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요해요.');
      return;
    }

    Alert.alert(
      '사진 선택',
      '성장 기록지 사진을 선택해주세요',
      [
        {
          text: '카메라로 촬영',
          onPress: async () => {
            const camPerm = await ImagePicker.requestCameraPermissionsAsync();
            if (camPerm.status !== 'granted') {
              Alert.alert('권한 필요', '카메라 접근 권한이 필요해요.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              await runOcr(result.assets[0].uri, apiKey!);
            }
          },
        },
        {
          text: '갤러리에서 선택',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              await runOcr(result.assets[0].uri, apiKey!);
            }
          },
        },
        { text: '취소', style: 'cancel' },
      ],
    );
  }, []);

  const runOcr = useCallback(async (uri: string, apiKey: string) => {
    setOcrLoading(true);
    try {
      const result = await extractGrowthFromImage(uri, apiKey);
      // Pre-fill form fields
      if (result.weightKg !== undefined) setWeightKg(String(result.weightKg));
      if (result.heightCm !== undefined) setHeightCm(String(result.heightCm));
      if (result.headCm !== undefined) setHeadCm(String(result.headCm));
      if (result.date) {
        const d = new Date(result.date + 'T00:00:00');
        if (!isNaN(d.getTime())) setEntryDate(d);
      }
      setModal(true);
      if (!result.weightKg && !result.heightCm && !result.headCm) {
        Alert.alert('인식 실패', '수치를 찾지 못했어요. 직접 입력해주세요.');
      } else {
        Alert.alert('인식 완료', '값을 확인하고 저장해주세요!');
      }
    } catch (e: any) {
      Alert.alert('오류', e.message ?? '사진 분석 중 오류가 발생했어요.');
    } finally {
      setOcrLoading(false);
    }
  }, []);

  const handleSaveApiKey = useCallback(async () => {
    if (!apiKeyInput.trim()) {
      Alert.alert('오류', 'API 키를 입력해주세요.');
      return;
    }
    await saveGeminiApiKey(apiKeyInput.trim());
    setApiKeyModal(false);
    setApiKeyInput('');
    // Retry OCR after key saved
    handleOcrPhoto();
  }, [apiKeyInput, handleOcrPhoto]);

  const handleSave = useCallback(async () => {
    if (!weightKg && !heightCm && !headCm) {
      Alert.alert('입력 필요', '최소 하나의 값을 입력해주세요.');
      return;
    }
    const entry: GrowthEntry = {
      id: Date.now().toString(),
      date: entryDate.toISOString(),
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      heightCm: heightCm ? parseFloat(heightCm) : undefined,
      headCm: headCm ? parseFloat(headCm) : undefined,
    };
    await addGrowthEntry(entry);
    setModal(false);
    setWeightKg(''); setHeightCm(''); setHeadCm('');
    setEntryDate(new Date());
    load();
  }, [weightKg, heightCm, headCm, entryDate, load]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('삭제', '이 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => { await deleteGrowthEntry(id); load(); } },
    ]);
  }, [load]);

  const latest = entries[0];

  const chartData = useMemo(() => {
    const sorted = [...entries].reverse();
    const maxPoints = 8;
    const slice = sorted.slice(-maxPoints);
    if (slice.length < 2) return null;

    const tab = CHART_TABS.find((t) => t.key === chartTab)!;
    const values: number[] = slice.map((e) => {
      if (chartTab === 'weight') return e.weightKg ?? 0;
      if (chartTab === 'height') return e.heightCm ?? 0;
      return e.headCm ?? 0;
    });

    if (values.every((v) => v === 0)) return null;

    return {
      labels: slice.map((e) => formatDate(e.date)),
      datasets: [{ data: values, strokeWidth: 2 }],
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
        r: '3',
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
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.ocrBtn} onPress={handleOcrPhoto} disabled={ocrLoading}>
            {ocrLoading
              ? <ActivityIndicator size="small" color={DS.primary} />
              : <>
                  <Ionicons name="camera-outline" size={16} color={DS.primary} />
                  <Text style={styles.ocrBtnText}>사진</Text>
                </>
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>추가</Text>
          </TouchableOpacity>
        </View>
      </View>

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
                      <View style={styles.heroItem}>
                        <Ionicons name="scale-outline" size={20} color={CHART_TABS[0].color} />
                        <Text style={[styles.heroVal, { color: CHART_TABS[0].color }]}>{latest.weightKg}</Text>
                        <Text style={styles.heroUnit}>kg</Text>
                      </View>
                    )}
                    {latest.heightCm !== undefined && (
                      <View style={styles.heroItem}>
                        <Ionicons name="resize-outline" size={20} color={CHART_TABS[1].color} />
                        <Text style={[styles.heroVal, { color: CHART_TABS[1].color }]}>{latest.heightCm}</Text>
                        <Text style={styles.heroUnit}>cm</Text>
                      </View>
                    )}
                    {latest.headCm !== undefined && (
                      <View style={styles.heroItem}>
                        <Ionicons name="ellipse-outline" size={20} color={CHART_TABS[2].color} />
                        <Text style={[styles.heroVal, { color: CHART_TABS[2].color }]}>{latest.headCm}</Text>
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
                      width={W - 40}
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
            <Ionicons name="analytics-outline" size={56} color={DS.textLight} />
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
                  <View style={[styles.rowChip, { backgroundColor: '#FFEFEF' }]}>
                    <Ionicons name="scale-outline" size={12} color={CHART_TABS[0].color} />
                    <Text style={[styles.rowChipText, { color: CHART_TABS[0].color }]}> {item.weightKg}kg</Text>
                  </View>
                )}
                {item.heightCm !== undefined && (
                  <View style={[styles.rowChip, { backgroundColor: '#EDF2FE' }]}>
                    <Ionicons name="resize-outline" size={12} color={CHART_TABS[1].color} />
                    <Text style={[styles.rowChipText, { color: CHART_TABS[1].color }]}> {item.heightCm}cm</Text>
                  </View>
                )}
                {item.headCm !== undefined && (
                  <View style={[styles.rowChip, { backgroundColor: '#F5F0FF' }]}>
                    <Ionicons name="ellipse-outline" size={12} color={CHART_TABS[2].color} />
                    <Text style={[styles.rowChipText, { color: CHART_TABS[2].color }]}> {item.headCm}cm</Text>
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
          <View style={styles.overlayTap} onStartShouldSetResponder={() => { setModal(false); setWeightKg(''); setHeightCm(''); setHeadCm(''); setEntryDate(new Date()); return true; }} />
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>성장 기록 추가</Text>

              <Text style={styles.fieldLabel}>측정 날짜</Text>
              <TouchableOpacity style={styles.fieldRow} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={18} color={DS.primary} style={{ marginRight: 10 }} />
                <Text style={[styles.fieldInput, { paddingVertical: 14, color: DS.text }]}>
                  {entryDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={DS.textLight} />
              </TouchableOpacity>

              {[
                { label: '몸무게 (kg)', icon: 'scale-outline' as const, color: CHART_TABS[0].color, value: weightKg, setter: setWeightKg, placeholder: '예: 4.5' },
                { label: '키 (cm)', icon: 'resize-outline' as const, color: CHART_TABS[1].color, value: heightCm, setter: setHeightCm, placeholder: '예: 55.0' },
                { label: '머리둘레 (cm)', icon: 'ellipse-outline' as const, color: CHART_TABS[2].color, value: headCm, setter: setHeadCm, placeholder: '예: 37.5' },
              ].map(({ label, icon, color, value, setter, placeholder }) => (
                <View key={label}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <View style={styles.fieldRow}>
                    <Ionicons name={icon} size={18} color={color} style={{ marginRight: 10 }} />
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
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModal(false); setWeightKg(''); setHeightCm(''); setHeadCm(''); setEntryDate(new Date()); }}>
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* API Key Modal */}
      <Modal visible={apiKeyModal} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Gemini API 키 입력</Text>
            <Text style={styles.apiKeyHint}>
              aistudio.google.com에서{'\n'}무료 API 키를 발급받으세요
            </Text>
            <TextInput
              style={styles.apiKeyInput}
              placeholder="AIza..."
              placeholderTextColor={DS.textLight}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.pickerDoneBtn} onPress={handleSaveApiKey}>
              <Text style={styles.pickerDoneBtnText}>저장하고 계속</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setApiKeyModal(false)}>
              <Text style={styles.cancelBtnText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date picker — Android */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={entryDate}
          mode="date"
          display="calendar"
          maximumDate={new Date()}
          onChange={(_, date) => { setShowDatePicker(false); if (date) setEntryDate(date); }}
        />
      )}

      {/* Date picker — iOS / Web */}
      {showDatePicker && Platform.OS !== 'android' && (
        <Modal transparent animationType="slide">
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerTitle}>측정 날짜 선택</Text>
              <DateTimePicker
                value={entryDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                maximumDate={new Date()}
                onChange={(_, date) => { if (date) setEntryDate(date); }}
                locale="ko-KR"
              />
              <TouchableOpacity style={styles.pickerDoneBtn} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.pickerDoneBtnText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.bg },

  header: {
    paddingHorizontal: DS.px, paddingTop: 8, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 32, fontWeight: '800', color: DS.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: DS.textLight, marginTop: 4 },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ocrBtn: {
    borderRadius: DS.radiusSm, paddingHorizontal: 12, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: DS.primary, minWidth: 56, justifyContent: 'center',
  },
  ocrBtnText: { color: DS.primary, fontSize: 14, fontWeight: '700' },
  addBtn: {
    backgroundColor: DS.primary, borderRadius: DS.radiusSm,
    paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  apiKeyHint: { fontSize: 13, color: DS.textSub, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  apiKeyInput: {
    backgroundColor: DS.bg, borderRadius: DS.radiusSm,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 14, color: DS.text, borderWidth: 1, borderColor: DS.border,
    marginBottom: 8,
  },

  list: { paddingHorizontal: DS.px, paddingBottom: 40 },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: DS.textSub,
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12,
  },

  // Hero
  heroCard: {
    backgroundColor: DS.surface, borderRadius: DS.radius, padding: 20, marginBottom: 8,
    ...cardShadow,
  },
  heroDate: { fontSize: 12, color: DS.textSub, marginBottom: 14 },
  heroRow: { flexDirection: 'row', gap: 10 },
  heroItem: {
    flex: 1, backgroundColor: DS.bg, borderRadius: DS.radiusSm,
    padding: 14, alignItems: 'center', gap: 4,
  },
  heroVal: { fontSize: 24, fontWeight: '800' },
  heroUnit: { fontSize: 12, color: DS.textLight },

  // Chart
  chartTabRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chartTabBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: DS.radiusSm, backgroundColor: DS.surface,
    borderWidth: 1, borderColor: DS.border,
  },
  chartTabText: { fontSize: 13, fontWeight: '700', color: DS.textSub },
  chartCard: {
    backgroundColor: DS.surface, borderRadius: DS.radius, padding: 16, marginBottom: 8,
    ...cardShadow,
  },
  chart: { borderRadius: DS.radiusSm, marginLeft: -10 },
  chartUnit: { fontSize: 11, color: DS.textLight, textAlign: 'right', marginTop: 4 },
  chartEmpty: {
    backgroundColor: DS.surface, borderRadius: DS.radius, padding: 24,
    alignItems: 'center', marginBottom: 8,
    ...cardShadow,
  },
  chartEmptyText: { color: DS.textLight, fontSize: 13 },

  // List
  row: {
    backgroundColor: DS.surface, borderRadius: DS.radius,
    padding: 14, flexDirection: 'row', alignItems: 'center',
    marginBottom: 10,
    ...cardShadow,
  },
  rowIdx: {
    width: 32, height: 32, borderRadius: DS.radius,
    backgroundColor: DS.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  rowIdxText: { fontSize: 13, fontWeight: '800', color: DS.primary },
  rowContent: { flex: 1 },
  rowDate: { fontSize: 13, fontWeight: '700', color: DS.text, marginBottom: 8 },
  rowChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rowChip: {
    borderRadius: DS.radiusXs, paddingHorizontal: 8, paddingVertical: 4,
    flexDirection: 'row', alignItems: 'center',
  },
  rowChipText: { fontSize: 12, fontWeight: '600' },
  deleteBtn: { padding: 8 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, color: DS.textSub, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  emptyHint: { fontSize: 13, color: DS.textLight, marginBottom: 24, textAlign: 'center' },
  emptyBtn: { backgroundColor: DS.primary, borderRadius: DS.radiusSm, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  overlayTap: { flex: 1 },
  sheet: {
    backgroundColor: DS.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: DS.px, paddingTop: 0, paddingBottom: 44,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: DS.border, alignSelf: 'center', marginTop: 10, marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: DS.text, marginBottom: 8 },
  fieldLabel: { fontSize: 12, color: DS.textSub, fontWeight: '600', marginBottom: 6, marginTop: 16 },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: DS.border, borderRadius: DS.radiusSm,
    paddingHorizontal: 14, backgroundColor: DS.surface,
  },
  fieldInput: { flex: 1, fontSize: 16, fontWeight: '600', color: DS.text, paddingVertical: 14 },
  saveBtn: { marginTop: 28, paddingVertical: 16, borderRadius: DS.radiusSm, alignItems: 'center', backgroundColor: DS.primary },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { marginTop: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: DS.textSub, fontSize: 15 },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: DS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  pickerTitle: { fontSize: 17, fontWeight: '800', color: DS.text, marginBottom: 12, textAlign: 'center' },
  pickerDoneBtn: { backgroundColor: DS.primary, borderRadius: DS.radiusSm, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  pickerDoneBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
