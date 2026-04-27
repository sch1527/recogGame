# 산성비 - 음성 인식 영어 게임

화면에서 떨어지는 영어 단어를 보고 목소리로 말해서 없애는 게임입니다.  
초등학교 저학년 어린이를 대상으로 설계되었으며, 어눌한 발음도 인식할 수 있도록 퍼지 매칭을 적용했습니다.

## 게임 방법

1. 앱을 실행하면 홈 화면이 나타납니다
2. START 버튼을 누르면 캐릭터 선택 화면으로 이동합니다
3. 원하는 캐릭터를 선택하고 SELECT를 누릅니다
4. 스테이지를 선택합니다 (단어를 탭하면 발음을 미리 들을 수 있습니다)
5. 단어들이 위에서 아래로 떨어집니다
6. 단어를 보고 소리 내어 말하면 레이저가 발사되어 단어가 사라집니다
7. 단어가 바닥에 닿으면 HP가 1 감소합니다
8. HP가 0이 되면 게임 오버
9. 난이도별 목표 점수를 달성하면 스테이지 클리어

## 캐릭터

| 캐릭터 | 파워 | 속도 | 콤보 | 특징 |
|-------|------|------|------|------|
| SingSing (싱싱) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐⭐⭐⭐ | 균형형 |
| EMBER (화염 전사) | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐ | 고화력 공격형 |
| VENOM (독소 외계인) | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | 고기동 속도형 |

캐릭터는 외형과 레이저 색상에만 영향을 미치며, 게임 플레이 밸런스는 동일합니다.

## 스킬 시스템

단어를 10개 맞추면 스킬 게이지가 채워지고, 화면에 **스킬 단어(⚡)** 가 등장합니다.  
스킬 단어를 맞추면 화면 위의 같은 단어가 모두 동시에 제거됩니다.

HP가 3 미만일 때 15% 확률로 **회복 단어**가 등장하며, 맞추면 HP가 1 회복됩니다.

## 스테이지 시스템

| 스테이지 | 주제 | 단어 예시 |
|---------|------|---------|
| 1 - 음식 🍕 | 음식 | Apple, Banana, Pizza, Cookie, Milk, Jelly |
| 2 - 동물 🐾 | 동물 | Lion, Tiger, Monkey, Zebra, Hippo, Snake |
| 3 - 탈것 🚗 | 탈것 | Car, Bus, Train, Plane, Bike, Boat |
| 4 - 색깔 🎨 | 색깔 | Red, Blue, Yellow, Green, Pink, White |

앞 스테이지를 클리어해야 다음 스테이지가 잠금 해제됩니다.  
스테이지 선택 화면에서 단어를 눌러 TTS로 발음을 미리 확인할 수 있습니다.

## 난이도 설정

설정 모달에서 난이도를 선택할 수 있으며, 선택한 난이도는 앱을 종료해도 유지됩니다.

| 난이도 | 클리어 목표 점수 | 단어 출현 간격 |
|-------|---------------|--------------|
| Easy  | 800점  | 7~11초 |
| Normal| 1000점 | 5~8초  |
| Hard  | 1200점 | 3~5초  |

점수는 `단어 길이 × 10 + 스테이지 번호 × 5`로 계산됩니다.

## 음성 인식 매칭 방식

어린이 발음을 고려해 네 가지 방식으로 정답을 판단합니다:

- **접두사 매칭**: 단어의 앞 30% 이상 발음하면 즉시 반응 (예: `"app"` → `"Apple"`)
- **Levenshtein 거리**: 오타 허용 범위 단어 길이의 50% (예: `"aple"` → `"Apple"`)
- **음소 정규화**: 유성·무성 쌍 통일 후 재비교 (b↔p, d↔t, g↔k, v↔f, z↔s)
- **Soundex**: 발음 패턴이 유사하면 정답 처리 (예: `"Lian"` → `"Lion"`)
- **숫자 → 단어 변환**: 음성 엔진이 숫자로 인식한 결과를 영어로 복원 (예: `"3"` → `"three"`)

인터림(interim) 결과도 즉시 처리하여 음성 엔진 지연 외 코드 지연을 최소화합니다.  
온디바이스 인식 실패 시 자동으로 클라우드 인식으로 전환됩니다.

## 일시정지

- 헤더의 ⚙ 버튼 또는 안드로이드 뒤로가기를 누르면 일시정지됩니다
- 홈 버튼 등으로 앱이 백그라운드로 전환되면 자동으로 일시정지됩니다
- 재개 시 3·2·1 카운트다운 후 게임이 이어집니다
- 일시정지 중 단어 낙하 시간은 정확히 누적되어 재개 시 반영됩니다

## 기술 스택

- [Expo](https://expo.dev) ~51 (React Native 0.74)
- [expo-speech-recognition](https://github.com/jamsch/expo-speech-recognition) - 음성 인식 (en-US, 온디바이스 우선)
- [@react-navigation/native-stack](https://reactnavigation.org) - 화면 전환
- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) - 단어 낙하·레이저 애니메이션
- [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) - UI 그라디언트
- [expo-av](https://docs.expo.dev/versions/latest/sdk/av/) / [expo-speech](https://docs.expo.dev/versions/latest/sdk/speech/) - 효과음 및 TTS
- [react-native-google-mobile-ads](https://docs.page/invertase/react-native-google-mobile-ads) - AdMob 광고
- [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io) - 설정·스테이지 잠금 영구 저장
- [expo-keep-awake](https://docs.expo.dev/versions/latest/sdk/keep-awake/) - 게임 중 화면 꺼짐 방지
- [expo-splash-screen](https://docs.expo.dev/versions/latest/sdk/splash-screen/) - 스플래시 화면

## 프로젝트 구조

```
src/
├── screens/
│   ├── HomeScreen.tsx              # 홈 화면
│   ├── CharacterSelectScreen.tsx   # 캐릭터 선택 화면 (슬라이드, 스탯 표시)
│   ├── StageSelectScreen.tsx       # 스테이지 선택 화면 (단어 미리보기 모달)
│   ├── GameScreen.tsx              # 게임 화면 (음성 인식 + 단어 낙하 + 스킬)
│   ├── StageClearScreen.tsx        # 스테이지 클리어 화면
│   └── GameOverScreen.tsx          # 게임 오버 화면
├── components/
│   ├── FallingWord.tsx             # 낙하하는 단어 컴포넌트 (일시정지 지원)
│   ├── Character.tsx               # 레이저 발사 캐릭터 (테마 적용)
│   ├── LaserBeam.tsx               # 레이저 빔 애니메이션
│   ├── VoicePanel.tsx              # 음성 인식 상태 표시 + 스킬 게이지
│   └── SettingsModal.tsx           # 설정 모달 (볼륨 슬라이더, 난이도, 홈 이동)
├── context/
│   └── SettingsContext.tsx         # BGM·SFX 볼륨·난이도·캐릭터 전역 상태
├── data/
│   ├── words.ts                    # 스테이지별 단어 목록
│   └── characters.ts               # 캐릭터 정의 (테마, 스탯)
└── utils/
    ├── unlocks.ts                  # 스테이지 잠금 해제 관리
    ├── admob.ts                    # Google AdMob 전면 광고
    └── wordSound.ts                # 단어 TTS 재생
```

## 실행 방법

```bash
# 패키지 설치
npm install

# Expo 개발 서버 시작
npm start

# Android 실행
npm run android

# Android APK 빌드
npm run build:android
```

> Android 기기 또는 에뮬레이터에서 마이크 권한을 허용해야 합니다.  
> `expo-speech-recognition`은 Expo Go를 지원하지 않으므로 EAS build 또는 custom dev client가 필요합니다.

## Copyright

Copyright © 2026 Amanta. All Rights Reserved.
