#!/bin/bash
set -e

JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"
ANDROID_HOME="C:/Users/sch/AppData/Local/Android/Sdk"
FRESCO_VERSION="3.1.3"

echo "=== 1. npm install ==="
npm install

echo "=== 2. android 폴더 생성 (prebuild) ==="
npx expo prebuild --platform android --clean

echo "=== 3. local.properties 생성 ==="
cat > android/local.properties << 'EOF'
sdk.dir=C\:\\Users\\sch\\AppData\\Local\\Android\\Sdk
EOF

echo "=== 4. settings.gradle 패치: version catalog 제거 ==="
node -e "
const fs = require('fs');
const path = 'android/settings.gradle';
let content = fs.readFileSync(path, 'utf8');
// dependencyResolutionManagement 블록 제거
content = content.replace(/\ndependencyResolutionManagement \{[\s\S]*?\}\n\}/m, '');
fs.writeFileSync(path, content);
console.log('settings.gradle 패치 완료');
"

echo "=== 5. app/build.gradle 패치: fresco 버전 하드코딩 ==="
node -e "
const fs = require('fs');
const path = 'android/app/build.gradle';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/\\\${reactAndroidLibs\.versions\.fresco\.get\(\)}/g, '${FRESCO_VERSION}');
fs.writeFileSync(path, content);
console.log('app/build.gradle 패치 완료');
"

echo "=== 6. gradle.properties에 VFS watch 비활성화 추가 ==="
echo "" >> android/gradle.properties
echo "org.gradle.vfs.watch=false" >> android/gradle.properties

echo "=== 7. APK 빌드 ==="
cd android
JAVA_HOME="$JAVA_HOME" ANDROID_HOME="$ANDROID_HOME" ./gradlew assembleRelease --no-daemon

echo ""
echo "=== 빌드 완료! ==="
echo "APK 위치: android/app/build/outputs/apk/release/app-release.apk"
