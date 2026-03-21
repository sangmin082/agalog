import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecordEntry } from '../types';

const KEY = 'agalog_records';

export async function getRecords(): Promise<RecordEntry[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addRecord(entry: RecordEntry): Promise<void> {
  const records = await getRecords();
  records.unshift(entry);
  await AsyncStorage.setItem(KEY, JSON.stringify(records));
}

export async function deleteRecord(id: string): Promise<void> {
  const records = await getRecords();
  const filtered = records.filter((r) => r.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
}
