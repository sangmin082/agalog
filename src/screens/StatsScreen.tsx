import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { getRecords } from '../storage';
import { RecordEntry, RecordType, RECORD_ICONS, RECORD_LABELS } from '../types';

const DS = {
  bg: '#F7F8FF',
  primary: '#6C5CE7',
  secondary: '#A29BFE',
  surface: '#FFFFFF',
  text: '#2D3436',
  textMuted: '#636E72',
  textLight: '#B2BEC3',
  radius: { large: 24, medium: 16, small: 12 },
};

const W = Dimensions.get('window').width - 40;

const CHART_BASE = {
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#F7F8FF',
  color: (opacity = 1) => `rgba(108, 92, 231, ${opacity})`,
  labelColor: () => '#636E72',
  strokeWidth: 2,
  propsForDots: { r: '5', strokeWidth: '2', stroke: '#6C5CE7' },
  propsForBackgroundLines: { stroke: '#F0F0FF', strokeWidth: 1 },
};

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
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
    records
      .filter((r) => r.type === type && new Date(r.startTime).toDateString() === day)
      .reduce((sum, r) => sum + (r.amountMl ?? 0), 0)
  );
}

function getHourlyDistribution(records: RecordEntry[], type: RecordType): number[] {
  const counts = new Array(24).fill(0);
  records.filter((r) => r.type === type).forEach((r) => {
    const h = new Date(r.startTime).getHours();
    counts[h]++;
  });
  return counts;
}

type Tab = 'daily' | 'hourly';

export default function StatsScreen({ refresh }: { refresh: number }) {
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [tab, setTab] = useState<Tab>('daily');

  const load = useCallback(async () => {
    setRecords(await getRecords());
  }, []);

  useEffect(() => { load(); }, [load, refresh]);

  const days = getLast7Days();
  const labels = days.map(getLabel);

  const breastfeedCounts = countByDay(records, 'breastfeed', days);
  const bottleCounts = countByDay(records, 'bottle', days);
  const peeCounts = countByDay(records, 'pee', days);
  const poopCounts = countByDay(records, 'poop', days);
  const pumpMl = totalMlByDay(records, 'pump', days);
  const bottleMl = totalMlByDay(records, 'bottle', days);

  const today = new Date().toDateString();
  const todayRecords = records.filter((r) => new Date(r.startTime).toDateString() === today);
  const totalBreastfeedMin = todayRecords
    .filter((r) => r.type === 'breastfeed')
    .reduce((s, r) => s + (r.leftMinutes ?? 0) + (r.rightMinutes ?? 0), 0);
  const totalBottleMl = todayRecords
    .filter((r) => r.type === 'bottle')
    .reduce((s, r) => s + (r.amountMl ?? 0), 0);
  const totalPumpMl = todayRecords
    .filter((r) => r.type === 'pump')
    .reduce((s, r) => s + (r.amountMl ?? 0), 0);

  const hourlyBreastfeed = getHourlyDistribution(records, 'breastfeed');
  const hourlyLabels = ['0시', '3시', '6시', '9시', '12시', '15시', '18시', '21시'];
  const hourlyData = [0, 3, 6, 9, 12, 15, 18, 21].map((h) =>
    hourlyBreastfeed.slice(h, h + 3).reduce((a, b) => a + b, 0)
  );

  const hasData = records.length > 0;

  const todayStatItems = [
    { icon: '🤱', label: '모유수유', val: `${todayRecords.filter(r => r.type === 'breastfeed').length}회`, sub: totalBreastfeedMin > 0 ? `${totalBreastfeedMin}분` : null, color: '#FF8FAB', bg: '#FFF0F5' },
    { icon: '🍼', label: '수유', val: `${todayRecords.filter(r => r.type === 'bottle').length}회`, sub: totalBottleMl > 0 ? `${totalBottleMl}ml` : null, color: '#5B9CF6', bg: '#EEF6FF' },
    { icon: '💛', label: '소변', val: `${todayRecords.filter(r => r.type === 'pee').length}회`, sub: null, color: '#D4A017', bg: '#FFFBEE' },
    { icon: '💩', label: '대변', val: `${todayRecords.filter(r => r.type === 'poop').length}회`, sub: null, color: '#8B6040', bg: '#FBF5EE' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>패턴 분석</Text>
          <Text style={styles.headerSub}>아가의 하루를 한눈에</Text>
        </View>

        {/* Today summary cards */}
        <View style={styles.todaySection}>
          <Text style={styles.sectionLabel}>오늘 요약</Text>
          <View style={styles.todayGrid}>
            {todayStatItems.map((item) => (
              <View key={item.label} style={[styles.todayCard, { borderTopColor: item.color, borderTopWidth: 3, backgroundColor: item.bg }]}>
                <Text style={styles.todayIcon}>{item.icon}</Text>
                <Text style={[styles.todayVal, { color: item.color }]}>{item.val}</Text>
                <Text style={styles.todayKey}>{item.label}</Text>
                {item.sub && <Text style={styles.todaySub}>{item.sub}</Text>}
              </View>
            ))}
          </View>
          {totalPumpMl > 0 && (
            <View style={styles.pumpBanner}>
              <Text style={styles.pumpBannerText}>🏺  오늘 유축 총 {totalPumpMl}ml</Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tabBtn, tab === 'daily' && styles.tabActive]} onPress={() => setTab('daily')}>
            <Text style={[styles.tabText, tab === 'daily' && styles.tabTextActive]}>📅 일별 추이</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === 'hourly' && styles.tabActive]} onPress={() => setTab('hourly')}>
            <Text style={[styles.tabText, tab === 'hourly' && styles.tabTextActive]}>🕐 시간대 패턴</Text>
          </TouchableOpacity>
        </View>

        {!hasData ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyText}>기록을 추가하면{'\n'}그래프가 나타나요!</Text>
          </View>
        ) : tab === 'daily' ? (
          <>
            <View style={styles.chartBox}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>수유 횟수 추이</Text>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: '#FF8FAB' }]} />
                  <Text style={styles.legendText}>모유</Text>
                  <View style={[styles.legendDot, { backgroundColor: '#5B9CF6' }]} />
                  <Text style={styles.legendText}>수유</Text>
                </View>
              </View>
              <LineChart
                data={{
                  labels,
                  datasets: [
                    { data: breastfeedCounts, color: () => '#FF8FAB', strokeWidth: 2 },
                    { data: bottleCounts, color: () => '#5B9CF6', strokeWidth: 2 },
                  ],
                  legend: ['모유수유', '수유'],
                }}
                width={W}
                height={180}
                chartConfig={CHART_BASE}
                bezier
                style={styles.chart}
                withLegend={false}
              />
            </View>

            <View style={styles.chartBox}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>소변 횟수 (7일)</Text>
              </View>
              <BarChart
                data={{
                  labels,
                  datasets: [{ data: peeCounts }],
                }}
                width={W}
                height={180}
                chartConfig={{ ...CHART_BASE, color: (o = 1) => `rgba(246, 198, 68, ${o})` }}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix="회"
              />
            </View>

            {pumpMl.some((v) => v > 0) && (
              <View style={styles.chartBox}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>유축량 (7일, ml)</Text>
                </View>
                <BarChart
                  data={{ labels, datasets: [{ data: pumpMl }] }}
                  width={W}
                  height={180}
                  chartConfig={{ ...CHART_BASE, color: (o = 1) => `rgba(107, 196, 106, ${o})` }}
                  style={styles.chart}
                  yAxisLabel=""
                  yAxisSuffix="ml"
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
                data={{ labels: hourlyLabels, datasets: [{ data: hourlyData }] }}
                width={W}
                height={200}
                chartConfig={{ ...CHART_BASE, color: (o = 1) => `rgba(255, 143, 171, ${o})` }}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix="회"
              />
            </View>

            <View style={styles.insightBox}>
              <Text style={styles.insightTitle}>💡  인사이트</Text>
              {(() => {
                const maxHourIdx = hourlyData.indexOf(Math.max(...hourlyData));
                const maxHour = hourlyLabels[maxHourIdx];
                const activeDays = days.filter(d => breastfeedCounts[days.indexOf(d)] > 0).length;
                const avg = records.filter(r => r.type === 'breastfeed').length / Math.max(activeDays, 1);
                return (
                  <View style={styles.insightItems}>
                    {Math.max(...hourlyData) > 0 && (
                      <View style={styles.insightItem}>
                        <Text style={styles.insightItemIcon}>⏰</Text>
                        <View>
                          <Text style={styles.insightItemLabel}>가장 많은 수유 시간대</Text>
                          <Text style={styles.insightItemVal}>{maxHour}</Text>
                        </View>
                      </View>
                    )}
                    <View style={styles.insightItem}>
                      <Text style={styles.insightItemIcon}>📈</Text>
                      <View>
                        <Text style={styles.insightItemLabel}>하루 평균 수유 횟수</Text>
                        <Text style={styles.insightItemVal}>{avg.toFixed(1)}회</Text>
                      </View>
                    </View>
                    <View style={styles.insightItem}>
                      <Text style={styles.insightItemIcon}>📝</Text>
                      <View>
                        <Text style={styles.insightItemLabel}>총 기록 수</Text>
                        <Text style={styles.insightItemVal}>{records.length}건</Text>
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
    backgroundColor: DS.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.70)', marginTop: 4 },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: DS.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  todaySection: { paddingHorizontal: 20, marginBottom: 20 },
  todayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  todayCard: {
    flex: 1,
    minWidth: '44%',
    borderRadius: DS.radius.medium,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#6C5CE7',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  todayIcon: { fontSize: 28, marginBottom: 8 },
  todayVal: { fontSize: 28, fontWeight: '900' },
  todayKey: { fontSize: 12, color: DS.textMuted, marginTop: 4, fontWeight: '600' },
  todaySub: { fontSize: 13, color: DS.primary, fontWeight: '700', marginTop: 4 },
  pumpBanner: {
    backgroundColor: '#EDFFF6',
    borderRadius: DS.radius.small,
    padding: 12,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00B894',
  },
  pumpBannerText: { fontSize: 14, color: '#00B894', fontWeight: '700' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#EDEDFF',
    borderRadius: DS.radius.medium,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  tabBtn: { flex: 1, padding: 10, borderRadius: 12, alignItems: 'center' },
  tabActive: { backgroundColor: DS.surface, shadowColor: '#6C5CE7', shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
  tabText: { fontSize: 13, color: DS.textMuted, fontWeight: '600' },
  tabTextActive: { color: DS.primary, fontWeight: '700' },

  chartBox: {
    backgroundColor: DS.surface,
    borderRadius: DS.radius.large,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#6C5CE7',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  chartTitle: { fontSize: 15, fontWeight: '700', color: DS.text },
  chartSub: { fontSize: 12, color: DS.textLight },
  chart: { borderRadius: 12, marginLeft: -8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: DS.textMuted },

  insightBox: {
    backgroundColor: '#EEF0FF',
    borderRadius: DS.radius.large,
    padding: 20,
    marginHorizontal: 20,
  },
  insightTitle: { fontSize: 16, fontWeight: '800', color: DS.primary, marginBottom: 16 },
  insightItems: { gap: 14 },
  insightItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  insightItemIcon: { fontSize: 28, width: 40, textAlign: 'center' },
  insightItemLabel: { fontSize: 12, color: DS.textMuted, marginBottom: 2 },
  insightItemVal: { fontSize: 18, fontWeight: '800', color: DS.primary },

  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: DS.textMuted, textAlign: 'center', lineHeight: 26, fontWeight: '600' },
});
