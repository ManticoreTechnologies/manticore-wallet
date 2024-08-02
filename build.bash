#!/bin/bash
#wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O commandlinetools-linux.zip
#unzip commandlinetools-linux.zip -d ~/Android/Sdk/cmdline-tools
mkdir -p ~/Android/Sdk/cmdline-tools
#mv ~/Android/Sdk/cmdline-tools/cmdline-tools ~/Android/Sdk/cmdline-tools/latest
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools
source ~/.bashrc
sdkmanager "platform-tools" "platforms;android-30" "build-tools;30.0.3"

# Remove previous APK set
rm -f my-apk-set.apks

# Build the project using EAS
npx expo prebuild --platform android
eas build --profile production --platform android --local

# Find the most recent AAB file in the build output directory
aab_file=$(find ./ -name "*.aab" -type f -printf "%T@ %p\n" | sort -n | tail -1 | cut -d' ' -f2-)

# Check if AAB file is found
if [ -z "$aab_file" ]; then
    echo "No AAB file found in the build output directory."
    exit 1
fi

# Build the APK set using bundletool
java -jar bundletool.jar build-apks --bundle="$aab_file" --output=my-apk-set.apks --ks=~/.android/debug.keystore --ks-key-alias=androiddebugkey --ks-pass=pass:android --key-pass=pass:android --mode=universal


# Create device spec file if it doesn't exist
cat <<EOF > device-spec.json
{
  "supportedAbis": ["arm64-v8a", "armeabi-v7a"],
  "supportedLocales": ["en"],
  "screenDensity": 480,
  "sdkVersion": 30
}
EOF

# Extract the universal.apk from my-apk-set.apks
java -jar bundletool.jar extract-apks --apks=my-apk-set.apks --output-dir=output-dir --device-spec=device-spec.json

echo "Universal APK extracted successfully: universal.apk"

adb install ./output-dir/universal.apk

echo "Universal APK installed successfully"