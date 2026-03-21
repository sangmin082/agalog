import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecordEntry, GrowthEntry } from '../types';

const KEY = 'agalog_records';
const GROWTH_KEY = 'agalog_growth';

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

export async function getGrowthEntries(): Promise<GrowthEntry[]> {
  const raw = await AsyncStorage.getItem(GROWTH_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addGrowthEntry(entry: GrowthEntry): Promise<void> {
  const entries = await getGrowthEntries();
  entries.unshift(entry);
  await AsyncStorage.setItem(GROWTH_KEY, JSON.stringify(entries));
}

export async function deleteGrowthEntry(id: string): Promise<void> {
  const entries = await getGrowthEntries();
  const filtered = entries.filter((e) => e.id !== id);
  await AsyncStorage.setItem(GROWTH_KEY, JSON.stringify(filtered));
}
