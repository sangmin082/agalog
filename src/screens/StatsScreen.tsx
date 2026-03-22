import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { getRecords } from '../storage';
import { RecordEntry, RecordType, RECORD_ICON_NAMES, RECORD_LABELS } from '../types';
import { DS, CARD_THEME, cardShadow } from '../theme';

const W = Dimensions.get('window').width - 40;

const CHART_BASE = {
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#FFFFFF',
  color: (opacity = 1) => `rgba(91, 91, 214, ${opacity})`,
  labelColor: () => DS.textLight,
  strokeWidth: 2,
  propsForDots: { r: '3', strokeWidth: '2', stroke: '#5B5BD6' },
  propsForBackgroundLines: { stroke: '#F0F0F0', strokeWidth: 1 },
  decimalPlaces: 0,
};

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });
}

function getLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function countByDay(records: RecordEntry[], type: RecordType, days: string[]): number[] {
  return days.map((day) =>
    records.filter((r) => r.type === type && new Date(r.startTime).toDateString() === day).length
  );
}

function totalMlByDay(records: RecordEntry[], type: RecordType, days: string[]): number[] {
  return days.map((day) =>
    records.filter((r) => r.type === type && new Date(r.startTime).toDateString() === day)
      .reduce((sum, r) => sum + (r.amountMl ?? 0), 0)
  );
}

function getHourlyDistribution(records: RecordEntry[], type: RecordType): number[] {
  const counts = new Array(24).fill(0);
  records.filter((r) => r.type === type).forEach((r) => {
    counts[new Date(r.startTime).getHours()]++;
  });
  return counts;
}

function formatHHMM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

type Tab = 'daily' | 'hourly';

export default function StatsScreen({ refresh }: { refresh: number }) {
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [tab, setTab] = useState<Tab>('daily');

  const load = useCallback(async () => { setRecords(await getRecords()); }, []);
  useEffect(() => { load(); }, [load, refresh]);

  const days = useMemo(() => getLast7Days(), []);
  const labels = useMemo(() => days.map(getLabel), [days]);

  const breastfeedCounts = useMemo(() => countByDay(records, 'breastfeed', days), [records, days]);
  const bottleCounts = useMemo(() => countByDay(records, 'bottle', days), [records, days]);
  const peeCounts = useMemo(() => countByDay(records, 'pee', days), [records, days]);
  const pumpMl = useMemo(() => totalMlByDay(records, 'pump', days), [records, days]);

  const todayRecords = useMemo(() => {
    const today = new Date().toDateString();
    return records.filter((r) => new Date(r.startTime).toDateString() === today);
  }, [records]);

  const totalBreastfeedMin = useMemo(() =>
    todayRecords.filter((r) => r.type === 'breastfeed')
      .reduce((s, r) => s + (r.leftMinutes ?? 0) + (r.rightMinutes ?? 0), 0),
    [todayRecords]
  );
  const totalBottleMl = useMemo(() =>
    todayRecords.filter((r) => r.type === 'bottle')
      .reduce((s, r) => s + (r.amountMl ?? 0), 0),
    [todayRecords]
  );
  const totalPumpMl = useMemo(() =>
    todayRecords.filter((r) => r.type === 'pump')
      .reduce((s, r) => s + (r.amountMl ?? 0), 0),
    [todayRecords]
  );

  const last24hRecords = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return records
      .filter((r) => new Date(r.startTime).getTime() >= cutoff)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [records]);

  const hourlyBreastfeed = useMemo(() => getHourlyDistribution(records, 'breastfeed'), [records]);
  const hourlyLabels = ['0시', '3시', '6시', '9시', '12시', '15시', '18시', '21시'];
  const hourlyData = useMemo(() =>
    [0, 3, 6, 9, 12, 15, 18, 21].map((h) =>
      hourlyBreastfeed.slice(h, h + 3).reduce((a, b) => a + b, 0)
    ),
    [hourlyBreastfeed]
  );

  const hasData = records.length > 0;

  const summaryItems = useMemo(() => [
    { icon: 'heart' as const, label: '모유수유', val: `${todayRecords.filter(r => r.type === 'breastfeed').length}회`, sub: totalBreastfeedMin > 0 ? `${totalBreastfeedMin}분` : null, accent: CARD_THEME.breastfeed.accent, tint: CARD_THEME.breastfeed.tint },
    { icon: 'water' as const, label: '수유', val: `${todayRecords.filter(r => r.type === 'bottle').length}회`, sub: totalBottleMl > 0 ? `${totalBottleMl}ml` : null, accent: CARD_THEME.bottle.accent, tint: CARD_THEME.bottle.tint },
    { icon: 'water-outline' as const, label: '소변', val: `${todayRecords.filter(r => r.type === 'pee').length}회`, sub: null, accent: CARD_THEME.pee.accent, tint: CARD_THEME.pee.tint },
    { icon: 'ellipse' as const, label: '대변', val: `${todayRecords.filter(r => r.type === 'poop').length}회`, sub: null, accent: CARD_THEME.poop.accent, tint: CARD_THEME.poop.tint },
  ], [todayRecords, totalBreastfeedMin, totalBottleMl]);

  const handleTabDaily = useCallback(() => setTab('daily'), []);
  const handleTabHourly = useCallback(() => setTab('hourly'), []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>분석</Text>
          <Text style={styles.headerSub}>아가의 하루를 한눈에</Text>
        </View>

        {/* ── Last 24h Timeline ── */}
        {last24hRecords.length > 0 && (
          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>최근 24시간</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timelineScroll}>
              {last24hRecords.map((r) => {
                const theme = CARD_THEME[r.type];
                return (
                  <View key={r.id} style={[styles.timelineBadge, { backgroundColor: theme?.tint ?? DS.bg }]}>
                    <Ionicons
                      name={RECORD_ICON_NAMES[r.type] as keyof typeof Ionicons.glyphMap}
                      size={16}
                      color={theme?.accent ?? DS.textSub}
                    />
                    <Text style={[styles.timelineBadgeTime, { color: theme?.accent ?? DS.textSub }]}>
                      {formatHHMM(r.startTime)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Section: Today summary */}
        <Text style={styles.sectionTitle}>오늘 요약</Text>
        <View style={styles.summaryGrid}>
          {summaryItems.map((item) => (
            <View key={item.label} style={styles.summaryCard}>
              <View style={[styles.summaryIconWrap, { backgroundColor: item.tint }]}>
                <Ionicons name={item.icon} size={20} color={item.accent} />
              </View>
              <Text style={[styles.summaryVal, { color: item.accent }]}>{item.val}</Text>
              <Text style={styles.summaryKey}>{item.label}</Text>
              {item.sub && <Text style={[styles.summarySub, { color: item.accent }]}>{item.sub}</Text>}
            </View>
          ))}
        </View>

        {totalPumpMl > 0 && (
          <View style={styles.pumpBanner}>
            <Ionicons name="flask" size={16} color={DS.success} />
            <Text style={styles.pumpText}>오늘 유축 총 {totalPumpMl}ml</Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Section: Charts */}
        <Text style={styles.sectionTitle}>차트</Text>

        {/* Tab switcher */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tabBtn, tab === 'daily' && styles.tabActive]} onPress={handleTabDaily}>
            <Text style={[styles.tabText, tab === 'daily' && styles.tabTextActive]}>일별 추이</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === 'hourly' && styles.tabActive]} onPress={handleTabHourly}>
            <Text style={[styles.tabText, tab === 'hourly' && styles.tabTextActive]}>시간대 패턴</Text>
          </TouchableOpacity>
        </View>

        {!hasData ? (
          <View style={styles.empty}>
            <Ionicons name="analytics-outline" size={56} color={DS.textLight} />
            <Text style={styles.emptyText}>기록을 추가하면{'\n'}그래프가 나타나요!</Text>
          </View>
        ) : tab === 'daily' ? (
          <>
            <View style={styles.chartBox}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>수유 횟수</Text>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: CARD_THEME.breastfeed.accent }]} />
                  <Text style={styles.legendLabel}>모유</Text>
                  <View style={[styles.legendDot, { backgroundColor: CARD_THEME.bottle.accent }]} />
                  <Text style={styles.legendLabel}>수유</Text>
                </View>
              </View>
              <LineChart
                data={{
                  labels,
                  datasets: [
                    { data: breastfeedCounts.every(v => v === 0) ? new Array(7).fill(0) : breastfeedCounts, color: () => CARD_THEME.breastfeed.accent, strokeWidth: 2 },
                    { data: bottleCounts.every(v => v === 0) ? new Array(7).fill(0) : bottleCounts, color: () => CARD_THEME.bottle.accent, strokeWidth: 2 },
                  ],
                  legend: [],
                }}
                width={W} height={180} chartConfig={CHART_BASE}
                bezier style={styles.chart}
              />
            </View>

            <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>소변 횟수 (7일)</Text>
              <BarChart
                data={{ labels, datasets: [{ data: peeCounts.every(v => v === 0) ? new Array(7).fill(0) : peeCounts }] }}
                width={W} height={180}
                chartConfig={{ ...CHART_BASE, color: (o = 1) => `rgba(240, 180, 41, ${o})` }}
                style={styles.chart} yAxisLabel="" yAxisSuffix="회"
              />
            </View>

            {pumpMl.some((v) => v > 0) && (
              <View style={styles.chartBox}>
                <Text style={styles.chartTitle}>유축량 (7일, ml)</Text>
                <BarChart
                  data={{ labels, datasets: [{ data: pumpMl }] }}
                  width={W} height={180}
                  chartConfig={{ ...CHART_BASE, color: (o = 1) => `rgba(48, 164, 108, ${o})` }}
                  style={styles.chart} yAxisLabel="" yAxisSuffix="ml"
                />
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.chartBox}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>수유 시간대 분포</Text>
                <Text style={styles.chartSub}>3시간 단위</Text>
              </View>
              <BarChart
                data={{ labels: hourlyLabels, datasets: [{ data: hourlyData.every(v => v === 0) ? new Array(8).fill(0) : hourlyData }] }}
                width={W} height={200}
                chartConfig={{ ...CHART_BASE, color: (o = 1) => `rgba(229, 72, 77, ${o})` }}
                style={styles.chart} yAxisLabel="" yAxisSuffix="회"
              />
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>인사이트</Text>

            <View style={styles.insightBox}>
              {(() => {
                const maxVal = hourlyData.length > 0 ? Math.max(...hourlyData) : 0;
                const maxHourIdx = maxVal > 0 ? hourlyData.indexOf(maxVal) : 0;
                const maxHour = hourlyLabels[maxHourIdx];
                const activeDays = days.filter(d => breastfeedCounts[days.indexOf(d)] > 0).length;
                const avg = records.filter(r => r.type === 'breastfeed').length / Math.max(activeDays, 1);
                return (
                  <View style={styles.insightItems}>
                    {Math.max(...hourlyData) > 0 && (
                      <View style={styles.insightItem}>
                        <View style={[styles.insightIcon, { backgroundColor: CARD_THEME.breastfeed.tint }]}>
                          <Ionicons name="time-outline" size={20} color={CARD_THEME.breastfeed.accent} />
                        </View>
                        <View style={styles.insightContent}>
                          <Text style={styles.insightLabel}>가장 많은 수유 시간대</Text>
                          <Text style={styles.insightVal}>{maxHour}</Text>
                        </View>
                      </View>
                    )}
                    <View style={styles.insightItem}>
                      <View style={[styles.insightIcon, { backgroundColor: CARD_THEME.bottle.tint }]}>
                        <Ionicons name="trending-up-outline" size={20} color={CARD_THEME.bottle.accent} />
                      </View>
                      <View style={styles.insightContent}>
                        <Text style={styles.insightLabel}>하루 평균 수유</Text>
                        <Text style={styles.insightVal}>{avg.toFixed(1)}회</Text>
                      </View>
                    </View>
                    <View style={styles.insightItem}>
                      <View style={[styles.insightIcon, { backgroundColor: CARD_THEME.pump.tint }]}>
                        <Ionicons name="document-text-outline" size={20} color={CARD_THEME.pump.accent} />
                      </View>
                      <View style={styles.insightContent}>
                        <Text style={styles.insightLabel}>총 기록</Text>
                        <Text style={styles.insightVal}>{records.length}건</Text>
                      </View>
                    </View>
                  </View>
                );
              })()}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.bg },
  scroll: { paddingBottom: 40 },

  header: {
    paddingHorizontal: DS.px, paddingTop: 8, paddingBottom: 16,
  },
  headerTitle: { fontSize: 32, fontWeight: '800', color: DS.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: DS.textLight, marginTop: 4 },

  divider: { height: 1, backgroundColor: DS.border, marginHorizontal: DS.px, marginVertical: 12 },

  // ── Section headers ──
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: DS.textSub,
    textTransform: 'uppercase', letterSpacing: 1.2,
    paddingHorizontal: DS.px, marginBottom: 10, marginTop: 4,
  },

  // ── 24h Timeline ──
  timelineSection: { marginBottom: 4 },
  timelineScroll: { paddingLeft: DS.px, paddingRight: 12, gap: 8, paddingBottom: 4 },
  timelineBadge: {
    borderRadius: DS.radiusSm, paddingHorizontal: 10, paddingVertical: 6,
    alignItems: 'center', minWidth: 52,
  },
  timelineBadgeTime: { fontSize: 10, fontWeight: '700', marginTop: 2 },

  // ── Summary ──
  summaryGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, paddingHorizontal: DS.px, marginBottom: 16,
  },
  summaryCard: {
    flex: 1, minWidth: (Dimensions.get('window').width - 40 - 10) / 2,
    backgroundColor: DS.surface, borderRadius: DS.radius,
    padding: 16, alignItems: 'center',
    ...cardShadow,
  },
  summaryIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  summaryVal: { fontSize: 24, fontWeight: '800' },
  summaryKey: { fontSize: 12, color: DS.textSub, marginTop: 4, fontWeight: '500' },
  summarySub: { fontSize: 13, fontWeight: '700', marginTop: 4 },

  pumpBanner: {
    backgroundColor: DS.surface, borderRadius: DS.radiusSm,
    padding: 12, marginHorizontal: DS.px, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: DS.border,
  },
  pumpText: { fontSize: 14, color: DS.success, fontWeight: '700' },

  tabs: {
    flexDirection: 'row', backgroundColor: DS.surface,
    borderRadius: DS.radiusSm, padding: 4, marginHorizontal: DS.px, marginBottom: 20,
    borderWidth: 1, borderColor: DS.border,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: DS.radiusXs, alignItems: 'center' },
  tabActive: { backgroundColor: DS.primary },
  tabText: { fontSize: 14, color: DS.textSub, fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '700' },

  chartBox: {
    backgroundColor: DS.surface, borderRadius: DS.radius,
    padding: 16, marginHorizontal: DS.px, marginBottom: 16,
    ...cardShadow,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  chartTitle: { fontSize: 15, fontWeight: '700', color: DS.text },
  chartSub: { fontSize: 12, color: DS.textLight },
  chart: { borderRadius: DS.radiusSm, marginLeft: -8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: DS.textSub },

  insightBox: {
    backgroundColor: DS.surface, borderRadius: DS.radius,
    padding: 20, marginHorizontal: DS.px,
    ...cardShadow,
  },
  insightItems: { gap: 16 },
  insightItem: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  insightIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  insightContent: {},
  insightLabel: { fontSize: 12, color: DS.textSub, marginBottom: 2 },
  insightVal: { fontSize: 18, fontWeight: '800', color: DS.text },

  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 40 },
  emptyText: { fontSize: 15, color: DS.textSub, textAlign: 'center', lineHeight: 24, fontWeight: '500', marginTop: 16 },
});
