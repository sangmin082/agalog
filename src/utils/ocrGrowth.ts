import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const GEMINI_KEY_STORAGE = 'agalog_gemini_api_key';
const DEFAULT_GEMINI_KEY = 'REMOVED_KEY';

export async function getGeminiApiKey(): Promise<string | null> {
  const stored = await AsyncStorage.getItem(GEMINI_KEY_STORAGE);
  return stored || DEFAULT_GEMINI_KEY;
}

export async function saveGeminiApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
}

export interface OcrGrowthResult {
  weightKg?: number;
  heightCm?: number;
  headCm?: number;
  date?: string; // YYYY-MM-DD if found
  rawText?: string;
}

export async function extractGrowthFromImage(
  imageUri: string,
  apiKey: string,
): Promise<OcrGrowthResult> {
  // Read image as base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: 'base64' as any,
  });

  const mimeType = imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

  const prompt = `이 이미지는 아기 성장 기록지 또는 병원 기록입니다.
이미지에서 다음 값들을 찾아서 JSON으로만 응답해주세요 (설명 없이 JSON만):
{
  "weightKg": <몸무게 숫자, kg 단위, 없으면 null>,
  "heightCm": <키/신장 숫자, cm 단위, 없으면 null>,
  "headCm": <머리둘레 숫자, cm 단위, 없으면 null>,
  "date": <측정날짜 "YYYY-MM-DD" 형식, 없으면 null>
}

숫자만 추출하세요 (단위 제외). 읽기 어려운 값은 null로 하세요.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 256,
        },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API 오류: ${response.status} - ${err.slice(0, 200)}`);
  }

  const json = await response.json();
  const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('응답에서 데이터를 찾을 수 없어요.');

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    weightKg: typeof parsed.weightKg === 'number' ? parsed.weightKg : undefined,
    heightCm: typeof parsed.heightCm === 'number' ? parsed.heightCm : undefined,
    headCm: typeof parsed.headCm === 'number' ? parsed.headCm : undefined,
    date: typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)
      ? parsed.date
      : undefined,
    rawText: text,
  };
}
