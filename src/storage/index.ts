import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecordEntry, GrowthEntry } from '../types';
import { getBabyProfile, saveBabyProfile } from './auth';

const KEY = 'agalog_records';
const GROWTH_KEY = 'agalog_growth';
const BIRTHDAY_KEY = 'agalog_baby_birthday';

export async function getRecords(): Promise<RecordEntry[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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

export async function getBabyBirthday(): Promise<string | null> {
  // Check new BabyProfile key first, then fall back to legacy key
  const profile = await getBabyProfile();
  if (profile?.birthday) return profile.birthday;
  return AsyncStorage.getItem(BIRTHDAY_KEY);
}

export async function setBabyBirthday(dateStr: string): Promise<void> {
  // Write to both the new BabyProfile and the legacy key for consistency
  await AsyncStorage.setItem(BIRTHDAY_KEY, dateStr);
  const profile = await getBabyProfile();
  if (profile) {
    profile.birthday = dateStr;
    await saveBabyProfile(profile);
  } else {
    await saveBabyProfile({ name: '', birthday: dateStr, birthTime: '' });
  }
}
