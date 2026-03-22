import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { getRecords } from '../storage';
import { RecordEntry, RecordType, RECORD_COLORS, RECORD_ICONS, RECORD_LABELS } from '../types';

const W = Dimensions.get('window').width - 32;

const CHART_CONFIG = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(116, 143, 252, ${opacity})`,
  labelColor: () => '#888',
  strokeWidth: 2,
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#748FFC' },
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

  // today stats
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

  // hourly distribution for breastfeed
  const hourlyBreastfeed = getHourlyDistribution(records, 'breastfeed');
  const hourlyLabels = ['0시', '3시', '6시', '9시', '12시', '15시', '18시', '21시'];
  const hourlyData = [0, 3, 6, 9, 12, 15, 18, 21].map((h) =>
    hourlyBreastfeed.slice(h, h + 3).reduce((a, b) => a + b, 0)
  );

  const hasData = records.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>패턴 분석 📊</Text>

        {/* 오늘 요약 카드 */}
        <View style={styles.todayCard}>
          <Text style={styles.cardTitle}>오늘 요약</Text>
          <View style={styles.todayRow}>
            <View style={styles.todayStat}>
              <Text style={styles.todayVal}>{todayRecords.filter(r=>r.type==='breastfeed').length}회</Text>
              <Text style={styles.todayKey}>🤱 모유수유</Text>
              {totalBreastfeedMin > 0 && <Text style={styles.todaySub}>{totalBreastfeedMin}분</Text>}
            </View>
            <View style={styles.todayStat}>
              <Text style={styles.todayVal}>{todayRecords.filter(r=>r.type==='bottle').length}회</Text>
              <Text style={styles.todayKey}>🍼 수유</Text>
              {totalBottleMl > 0 && <Text style={styles.todaySub}>{totalBottleMl}ml</Text>}
            </View>
            <View style={styles.todayStat}>
              <Text style={styles.todayVal}>{todayRecords.filter(r=>r.type==='pee').length}회</Text>
              <Text style={styles.todayKey}>💛 소변</Text>
            </View>
            <View style={styles.todayStat}>
              <Text style={styles.todayVal}>{todayRecords.filter(r=>r.type==='poop').length}회</Text>
              <Text style={styles.todayKey}>💩 대변</Text>
            </View>
          </View>
          {totalPumpMl > 0 && (
            <Text style={styles.pumpStat}>🏺 오늘 유축 총 {totalPumpMl}ml</Text>
          )}
        </View>

        {/* 탭 */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tabBtn, tab === 'daily' && styles.tabActive]} onPress={() => setTab('daily')}>
            <Text style={[styles.tabText, tab === 'daily' && styles.tabTextActive]}>일별 추이</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === 'hourly' && styles.tabActive]} onPress={() => setTab('hourly')}>
            <Text style={[styles.tabText, tab === 'hourly' && styles.tabTextActive]}>시간대 패턴</Text>
          </TouchableOpacity>
        </View>

        {!hasData ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>기록을 추가하면 그래프가 나타나요!</Text>
          </View>
        ) : tab === 'daily' ? (
          <>
            {/* 수유 횟수 */}
            <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>🤱🍼 수유 횟수 (7일)</Text>
              <LineChart
                data={{
                  labels,
                  datasets: [
                    { data: breastfeedCounts, color: () => '#FF8FAB', strokeWidth: 2 },
                    { data: bottleCounts, color: () => '#74C0FC', strokeWidth: 2 },
                  ],
                  legend: ['모유수유', '수유'],
                }}
                width={W}
                height={180}
                chartConfig={CHART_CONFIG}
                bezier
                style={styles.chart}
              />
            </View>

            {/* 소변/대변 */}
            <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>💛💩 소변/대변 횟수 (7일)</Text>
              <BarChart
                data={{
                  labels,
                  datasets: [{ data: peeCounts }],
                }}
                width={W}
                height={180}
                chartConfig={{ ...CHART_CONFIG, color: (o = 1) => `rgba(255, 212, 59, ${o})` }}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix="회"
              />
            </View>

            {/* 유축량 */}
            {pumpMl.some((v) => v > 0) && (
              <View style={styles.chartBox}>
                <Text style={styles.chartTitle}>🏺 유축량 (7일, ml)</Text>
                <BarChart
                  data={{ labels, datasets: [{ data: pumpMl }] }}
                  width={W}
                  height={180}
                  chartConfig={{ ...CHART_CONFIG, color: (o = 1) => `rgba(169, 227, 75, ${o})` }}
                  style={styles.chart}
                  yAxisLabel=""
                  yAxisSuffix="ml"
                />
              </View>
            )}
          </>
        ) : (
          <>
            {/* 시간대별 수유 패턴 */}
            <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>🤱 수유 시간대 분포</Text>
              <Text style={styles.chartSub}>3시간 단위</Text>
              <BarChart
                data={{ labels: hourlyLabels, datasets: [{ data: hourlyData }] }}
                width={W}
                height={200}
                chartConfig={{ ...CHART_CONFIG, color: (o = 1) => `rgba(255, 143, 171, ${o})` }}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix="회"
              />
            </View>

            {/* 인사이트 */}
            <View style={styles.insightBox}>
              <Text style={styles.insightTitle}>💡 인사이트</Text>
              {(() => {
                const maxHourIdx = hourlyData.indexOf(Math.max(...hourlyData));
                const maxHour = hourlyLabels[maxHourIdx];
                const avg = records.filter(r => r.type === 'breastfeed').length / Math.max(days.filter(d => breastfeedCounts[days.indexOf(d)] > 0).length, 1);
                return (
                  <>
                    {Math.max(...hourlyData) > 0 && (
                      <Text style={styles.insightItem}>• 수유가 가장 많은 시간대: <Text style={styles.insightVal}>{maxHour}</Text></Text>
                    )}
                    <Text style={styles.insightItem}>• 하루 평균 수유: <Text style={styles.insightVal}>{avg.toFixed(1)}회</Text></Text>
                    <Text style={styles.insightItem}>• 총 기록 수: <Text style={styles.insightVal}>{records.length}건</Text></Text>
                  </>
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
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 16, color: '#222' },
  todayCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 13, color: '#999', fontWeight: '600', marginBottom: 12 },
  todayRow: { flexDirection: 'row', justifyContent: 'space-around' },
  todayStat: { alignItems: 'center' },
  todayVal: { fontSize: 20, fontWeight: '800', color: '#222' },
  todayKey: { fontSize: 11, color: '#888', marginTop: 2 },
  todaySub: { fontSize: 11, color: '#748FFC', marginTop: 2, fontWeight: '600' },
  pumpStat: { textAlign: 'center', marginTop: 12, fontSize: 13, color: '#555' },
  tabs: { flexDirection: 'row', backgroundColor: '#eee', borderRadius: 12, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, color: '#888', fontWeight: '600' },
  tabTextActive: { color: '#748FFC' },
  chartBox: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  chartTitle: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 4 },
  chartSub: { fontSize: 12, color: '#aaa', marginBottom: 8 },
  chart: { borderRadius: 12, marginLeft: -8 },
  insightBox: { backgroundColor: '#EEF0FF', borderRadius: 18, padding: 18 },
  insightTitle: { fontSize: 15, fontWeight: '700', color: '#748FFC', marginBottom: 12 },
  insightItem: { fontSize: 14, color: '#444', marginBottom: 8, lineHeight: 22 },
  insightVal: { fontWeight: '800', color: '#748FFC' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#aaa' },
});
