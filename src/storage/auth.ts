import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const AUTH_KEY = 'agalog_auth_user';
const BABY_KEY = 'agalog_baby_profile';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  provider: 'email' | 'kakao' | 'naver';
  createdAt: string;
}

export interface BabyProfile {
  name: string;
  birthday: string;  // YYYY-MM-DD
  birthTime: string; // HH:MM
}

async function hashPassword(password: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function signupWithEmail(
  email: string,
  password: string,
  name: string,
): Promise<AuthUser> {
  const existing = await getAuthUser();
  if (existing && existing.email === email) {
    throw new Error('이미 가입된 이메일입니다.');
  }
  const user: AuthUser = {
    id: Date.now().toString(),
    email,
    name,
    passwordHash: await hashPassword(password),
    provider: 'email',
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await getAuthUser();
  if (!user || user.email !== normalizedEmail) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
  return user;
}

export async function loginWithSocial(
  provider: 'kakao' | 'naver',
  name: string,
  email: string,
): Promise<AuthUser> {
  const user: AuthUser = {
    id: `${provider}_${Date.now()}`,
    email,
    name,
    passwordHash: '',
    provider,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_KEY);
}

export async function getBabyProfile(): Promise<BabyProfile | null> {
  const raw = await AsyncStorage.getItem(BABY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveBabyProfile(profile: BabyProfile): Promise<void> {
  await AsyncStorage.setItem(BABY_KEY, JSON.stringify(profile));
}
