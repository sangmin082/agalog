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

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>기록 히스토리 📋</Text>
      {records.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>아직 기록이 없어요</Text>
          <Text style={styles.emptyHint}>홈에서 기록을 추가해보세요!</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.row, { borderLeftColor: RECORD_COLORS[item.type], borderLeftWidth: 4 }]}>
              <Text style={styles.icon}>{RECORD_ICONS[item.type]}</Text>
              <View style={styles.info}>
                <Text style={styles.label}>{RECORD_LABELS[item.type]}</Text>
                <Text style={styles.time}>{formatTime(item.startTime)}</Text>
                {getDetail(item) ? <Text style={styles.detail}>{getDetail(item)}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>삭제</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  title: { fontSize: 22, fontWeight: '800', margin: 16, color: '#222' },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  row: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  icon: { fontSize: 30, marginRight: 12 },
  info: { flex: 1 },
  label: { fontSize: 16, fontWeight: '700', color: '#222' },
  time: { fontSize: 12, color: '#999', marginTop: 2 },
  detail: { fontSize: 13, color: '#555', marginTop: 4 },
  deleteBtn: { padding: 8 },
  deleteText: { color: '#FF6B6B', fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 18, color: '#aaa', fontWeight: '600' },
  emptyHint: { fontSize: 13, color: '#ccc', marginTop: 8 },
});
