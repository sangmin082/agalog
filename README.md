# 아가로그 (AgaLog) 🍼

> 육아 기록 & 분석 앱 — iOS / Android

신생아 육아 기록을 쉽고 빠르게. 수유, 수면, 배변 패턴을 한눈에 확인하세요.

---

## 기능

| 기능 | 설명 |
|------|------|
| 🤱 모유수유 | 좌/우 수유 시간(분) 기록 |
| 🍼 수유 | 분유/젖병 수유량(ml) 기록 |
| 🏺 유축 | 유축량(ml) 기록 |
| 💛 소변 | 기저귀 소변 기록 |
| 💩 대변 | 기저귀 대변 기록 |
| 🤢 구토 | 구토 기록 |
| 📋 기록 히스토리 | 전체 기록 타임라인 조회 및 삭제 |

---

## 기술 스택

- **React Native** (Expo)
- **TypeScript**
- **React Navigation** (Bottom Tabs)
- **AsyncStorage** (로컬 데이터 저장)

---

## 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 플랫폼별 실행
npm run android
npm run ios
npm run web
```

### Expo Go로 테스트 (권장)
1. 아이폰/안드로이드에 **Expo Go** 앱 설치
2. `npm start` 실행
3. 터미널에 표시된 QR코드 스캔

---

## 프로젝트 구조

```
agalog/
├── App.tsx                  # 루트 컴포넌트, 네비게이션
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx   # 기록 입력 홈
│   │   └── HistoryScreen.tsx# 기록 히스토리
│   ├── storage/
│   │   └── index.ts         # AsyncStorage CRUD
│   └── types/
│       └── index.ts         # 타입 정의
└── assets/                  # 아이콘, 스플래시
```

---

## 배포

### EAS Build (Mac 없이 iOS 빌드 가능)

```bash
npm install -g eas-cli
eas login
eas build --platform all
```

---

## 로드맵

- [ ] 수면 기록 및 타이머
- [ ] AI 패턴 분석 리포트
- [ ] 소아과 방문용 요약 리포트
- [ ] 가족 공유 (조부모, 베이비시터)
- [ ] 또래 아기와 패턴 비교
- [ ] Apple Health / Google Fit 연동
