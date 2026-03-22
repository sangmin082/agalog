import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getRecords, deleteRecord } from '../storage';
import { RecordEntry, RECORD_LABELS, RECORD_ICONS } from '../types';
import { DS, CARD_THEME, getRelativeTime } from '../theme';

function formatTimeOnly(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h < 12 ? '오전' : '오후';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${ampm} ${hour12}:${m}`;
}

function formatDateOnly(iso: string) {
  const d = new Date(iso);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

function getDetail(entry: RecordEntry): string {
  const parts: string[] = [];
  if (entry.leftMinutes) parts.push(`좌 ${entry.leftMinutes}분`);
  if (entry.rightMinutes) parts.push(`우 ${entry.rightMinutes}분`);
  if (entry.amountMl) parts.push(`${entry.amountMl}ml`);
  if (entry.durationMinutes) parts.push(`${entry.durationMinutes}분`);
  if (entry.note) parts.push(entry.note);
  return parts.join(' · ');
}

function groupByDate(records: RecordEntry[]): { date: string; items: RecordEntry[] }[] {
  const map = new Map<string, RecordEntry[]>();
  for (const r of records) {
    const dateKey = new Date(r.startTime).toDateString();
    if (!map.has(dateKey)) map.set(dateKey, []);
    map.get(dateKey)!.push(r);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

export default function HistoryScreen({ refresh }: { refresh: number }) {
  const [records, setRecords] = useState<RecordEntry[]>([]);

  const load = useCallback(async () => {
    const data = await getRecords();
    setRecords(data);
  }, []);

  useEffect(() => { load(); }, [load, refresh]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('삭제', '이 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => { await deleteRecord(id); load(); } },
    ]);
  }, [load]);

  const grouped = useMemo(() => groupByDate(records), [records]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>기록</Text>
        <Text style={styles.headerSub}>총 {records.length}건</Text>
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {records.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>아직 기록이 없어요</Text>
          <Text style={styles.emptyHint}>홈 탭에서 첫 기록을 추가해보세요!</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: group }) => (
            <View style={styles.dateGroup}>
              {/* Date divider */}
              <View style={styles.dateHeader}>
                <Text style={styles.dateLabel}>{formatDateOnly(group.items[0].startTime)}</Text>
                <View style={styles.dateLine} />
              </View>

              {/* Timeline cards */}
              {group.items.map((item, idx) => {
                const accent = CARD_THEME[item.type]?.accent ?? DS.textSub;
                const relTime = getRelativeTime(item.startTime);
                return (
                  <View key={item.id} style={styles.timelineRow}>
                    {/* Timeline left: dot + line */}
                    <View style={styles.tlLeft}>
                      <View style={[styles.tlDot, { backgroundColor: accent }]} />
                      {idx < group.items.length - 1 && <View style={styles.tlLine} />}
                    </View>

                    {/* Card */}
                    <View style={[styles.card, { borderLeftColor: accent }]}>
                      <View style={styles.cardTop}>
                        <View style={styles.cardTitleRow}>
                          <Text style={styles.cardEmoji}>{RECORD_ICONS[item.type]}</Text>
                          <Text style={styles.cardName}>{RECORD_LABELS[item.type]}</Text>
                        </View>
                        <View style={styles.cardTimeCol}>
                          <Text style={[styles.cardRelTime, { color: accent }]}>{relTime}</Text>
                          <Text style={styles.cardAbsTime}>{formatTimeOnly(item.startTime)}</Text>
                        </View>
                      </View>
                      {getDetail(item) ? (
                        <Text style={styles.cardDetail}>{getDetail(item)}</Text>
                      ) : null}
                      <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.deleteText}>삭제</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.bg },

  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: DS.text },
  headerSub: { fontSize: 14, color: DS.primary, fontWeight: '700' },

  separator: { height: 1, backgroundColor: DS.primary + '10', marginHorizontal: 24, marginBottom: 8 },

  list: { paddingHorizontal: 20, paddingBottom: 40 },

  dateGroup: { marginBottom: 8 },
  dateHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10,
  },
  dateLabel: {
    fontSize: 13, fontWeight: '700', color: DS.primary,
    backgroundColor: DS.primaryLight,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: '#EEF0FF' },

  timelineRow: { flexDirection: 'row', marginBottom: 10 },
  tlLeft: { width: 24, alignItems: 'center', paddingTop: 18 },
  tlDot: {
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: '#FFFFFF',
    zIndex: 1,
  },
  tlLine: { width: 2, flex: 1, backgroundColor: '#EEF0FF', marginTop: 4, minHeight: 24 },

  card: {
    flex: 1, backgroundColor: DS.bgSoft,
    borderRadius: 16, padding: 14, marginLeft: 10,
    borderLeftWidth: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardEmoji: { fontSize: 20 },
  cardName: { fontSize: 16, fontWeight: '700', color: DS.text },
  cardTimeCol: { alignItems: 'flex-end' },
  cardRelTime: { fontSize: 13, fontWeight: '700' },
  cardAbsTime: { fontSize: 11, color: DS.textLight, marginTop: 2 },
  cardDetail: { fontSize: 13, color: DS.textSub, marginTop: 6 },

  deleteText: { color: '#E5484D', fontSize: 12, fontWeight: '600', marginTop: 8 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, color: DS.textSub, fontWeight: '700', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: DS.textLight },
});
