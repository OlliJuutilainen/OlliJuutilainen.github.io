#!/usr/bin/env bash
set -euo pipefail
SER="${SER:-LP3LHMA541401108}"
PKG="fi.ouroboros.android"

cd "$(dirname "$0")/.."

./gradlew :ouroboros:installDebug -Pandroid.injected.device.serial="$SER"
adb -s "$SER" shell am start -W "$PKG"/.MainActivity
adb -s "$SER" logcat -d | egrep -i "ΒΟΡΟΦΘΟΡΟΣ|AndroidRuntime|FATAL" | tail -n 200 || true
