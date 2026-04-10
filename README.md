# 산성비 - 음성 인식 영어 게임

화면에서 떨어지는 영어 단어를 보고 목소리로 말해서 없애는 게임입니다.  
초등학교 저학년 어린이를 대상으로 설계되었으며, 어눌한 발음도 인식할 수 있도록 퍼지 매칭을 적용했습니다.

## 게임 방법

1. 앱을 실행하면 홈 화면이 나타납니다
2. 게임 시작 버튼을 누르면 영어 단어들이 위에서 아래로 떨어집니다
3. 단어를 보고 소리 내어 말하면 정답 처리되어 사라집니다
4. 단어가 바닥에 닿으면 목숨(♥)이 1개 줄어듭니다
5. 목숨 3개를 모두 잃으면 게임 오버

## 레벨 시스템

| 레벨 | 단어 난이도 | 단어 속도 |
|------|------------|----------|
| 1~2  | 쉬운 단어 (run, bird, snow...) | 느림 |
| 3~4  | 중간 단어 추가 (happy, ocean...) | 보통 |
| 5+   | 어려운 단어 추가 (adventure, chocolate...) | 빠름 |

단어 5개를 맞출 때마다 레벨이 올라갑니다.

## 음성 인식 매칭 방식

어린이 발음을 고려해 세 가지 방식으로 정답을 판단합니다:

- 퍼지 매칭: 오타 1~2글자 허용 (단어 길이의 20%)
- Soundex: 발음이 비슷하면 정답 처리 (예: "aple" → "apple")
- 접두사 매칭: 단어의 앞 60% 이상 발음하면 정답 (예: "sno" → "snow")

## 기술 스택

- [Expo](https://expo.dev) (React Native)
- [expo-speech-recognition](https://github.com/jamsch/expo-speech-recognition) - 음성 인식
- [@react-navigation/native-stack](https://reactnavigation.org) - 화면 전환
- [lottie-react-native](https://github.com/lottie-react-native/lottie-react-native) - 애니메이션
- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) - 단어 낙하 애니메이션

## 프로젝트 구조

```
src/
├── screens/
│   ├── HomeScreen.tsx      # 홈 화면
│   ├── GameScreen.tsx      # 게임 화면 (음성 인식 + 단어 낙하)
│   └── GameOverScreen.tsx  # 게임 오버 화면
├── components/
│   ├── FallingWord.tsx     # 낙하하는 단어 컴포넌트
│   └── VoicePanel.tsx      # 음성 인식 상태 표시 패널
└── data/
    └── words.ts            # 레벨별 단어 목록
```

## 실행 방법

```bash
# 패키지 설치
npm install

# Expo 개발 서버 시작
npm start

# Android 실행
npm run android
```

> Android 기기 또는 에뮬레이터에서 마이크 권한을 허용해야 합니다.
