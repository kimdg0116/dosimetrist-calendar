#!/bin/zsh
# Dosimetrist Calendar.app (mac/main.swift → 맥 앱 한 개, 창 한 개) 를 만들어 ~/Applications 에 넣는다. Dock 으로 끌어다 두면 된다.
set -e
cd "$(dirname "$0")/.."
APP="$HOME/Applications/Dosimetrist Calendar.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
swiftc -O mac/main.swift -o "$APP/Contents/MacOS/dosimetrist-calendar"
cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleIdentifier</key><string>com.kimdg0116.dosimetrist-calendar</string>
  <key>CFBundleName</key><string>Dosimetrist Calendar</string>
  <key>CFBundleDisplayName</key><string>Dosimetrist Calendar</string>
  <key>CFBundleExecutable</key><string>dosimetrist-calendar</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
# 아이콘: 폰 앱 아이콘(icon-1024.png)을 맥 아이콘 모양(흰 둥근 네모, 둘레 여백)에 얹는다
T=$(mktemp -d)
python3 - "$T/icon.png" <<'PY'
import sys
from PIL import Image, ImageDraw
n, pad, r = 1024, 100, 185
src = Image.open('icon-1024.png').convert('RGBA').resize((n - 2*pad,) * 2, Image.LANCZOS)
mask = Image.new('L', src.size, 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, *src.size), radius=r, fill=255)
im = Image.new('RGBA', (n, n), (0, 0, 0, 0)); im.paste(src, (pad, pad), mask)
im.save(sys.argv[1])
PY
mkdir "$T/a.iconset"
for s in 16 32 128 256 512; do
  sips -z $s $s "$T/icon.png" --out "$T/a.iconset/icon_${s}x${s}.png" >/dev/null
  sips -z $((s*2)) $((s*2)) "$T/icon.png" --out "$T/a.iconset/icon_${s}x${s}@2x.png" >/dev/null
done
iconutil -c icns "$T/a.iconset" -o "$APP/Contents/Resources/AppIcon.icns"
rm -rf "$T"
codesign --force --deep -s - "$APP"
touch "$APP"
echo "만듦: $APP"
