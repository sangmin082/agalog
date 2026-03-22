import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getRecords, deleteRecord } from '../storage';
import { RecordEntry, RECORD_LABELS, RECORD_ICONS, RECORD_COLORS } from '../types';

const DS = {
  bg: '#F7F8FF',
  primary: '#6C5CE7',
  secondary: '#A29BFE',
  surface: '#FFFFFF',
  danger: '#FF7675',
  text: '#2D3436',
  textMuted: '#636E72',
  textLight: '#B2BEC3',
  radius: { large: 24, medium: 16, small: 12 },
};

const TYPE_DOT_COLOR: Record<string, string> = {
  breastfeed: '#FF8FAB',
  bottle: '#5B9CF6',
  pump: '#6BC46A',
  pee: '#F6C644',
  poop: '#B07D52',
  vomit: '#9B8EC4',
};

function formatTimeFull(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatTimeOnly(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
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

  async function handleDelete(id: string) {
    Alert.alert('삭제', '이 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive', onPress: async () => {
          await deleteRecord(id);
          load();
        },
      },
    ]);
  }

  const grouped = groupByDate(records);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerDeco1} />
        <View style={styles.headerDeco2} />
        <Text style={styles.headerTitle}>기록 히스토리</Text>
        <Text style={styles.headerSub}>총 {records.length}개의 기록</Text>
      </View>

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
              {/* Date header */}
              <View style={styles.dateHeader}>
                <View style={styles.dateDivider} />
                <Text style={styles.dateLabel}>{formatDateOnly(group.items[0].startTime)}</Text>
                <View style={styles.dateDivider} />
              </View>

              {/* Timeline items */}
              <View style={styles.timeline}>
                {group.items.map((item, idx) => (
                  <View key={item.id} style={styles.timelineRow}>
                    {/* Left column: dot + line */}
                    <View style={styles.timelineLeft}>
                      <View style={[styles.dot, { backgroundColor: TYPE_DOT_COLOR[item.type] }]} />
                      {idx < group.items.length - 1 && <View style={styles.line} />}
                    </View>

                    {/* Card */}
                    <View style={[styles.card, { borderLeftColor: TYPE_DOT_COLOR[item.type] }]}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardTitleRow}>
                          <Text style={styles.cardIcon}>{RECORD_ICONS[item.type]}</Text>
                          <Text style={styles.cardLabel}>{RECORD_LABELS[item.type]}</Text>
                        </View>
                        <View style={styles.cardRight}>
                          <Text style={styles.cardTime}>{formatTimeOnly(item.startTime)}</Text>
                          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                            <Text style={styles.deleteText}>삭제</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {getDetail(item) ? (
                        <Text style={styles.cardDetail}>{getDetail(item)}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
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
    backgroundColor: DS.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  headerDeco1: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.07)', top: -25, right: 60 },
  headerDeco2: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.06)', bottom: -15, right: 20 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.70)', marginTop: 4 },

  list: { paddingHorizontal: 20, paddingBottom: 40 },

  dateGroup: { marginBottom: 8 },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  dateDivider: { flex: 1, height: 1, backgroundColor: '#E8EAFF' },
  dateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: DS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#EEF0FF',
    borderRadius: 8,
  },

  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  timelineLeft: { width: 28, alignItems: 'center', paddingTop: 16 },
  dot: { width: 14, height: 14, borderRadius: 7, zIndex: 1, borderWidth: 2, borderColor: '#FFFFFF' },
  line: { width: 2, flex: 1, backgroundColor: '#E0E3FF', marginTop: 6, minHeight: 30 },

  card: {
    flex: 1,
    backgroundColor: DS.surface,
    borderRadius: DS.radius.medium,
    padding: 14,
    marginLeft: 10,
    borderLeftWidth: 3,
    shadowColor: '#6C5CE7',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardIcon: { fontSize: 20 },
  cardLabel: { fontSize: 16, fontWeight: '700', color: DS.text },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardTime: { fontSize: 15, fontWeight: '700', color: DS.primary },
  cardDetail: { fontSize: 13, color: DS.textMuted, marginTop: 6 },

  deleteBtn: { padding: 2 },
  deleteText: { color: DS.danger, fontSize: 12, fontWeight: '600' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyEmoji: { fontSize: 72, marginBottom: 20 },
  emptyTitle: { fontSize: 22, color: DS.textMuted, fontWeight: '800', marginBottom: 10 },
  emptyHint: { fontSize: 14, color: DS.textLight, textAlign: 'center', paddingHorizontal: 40 },
});
