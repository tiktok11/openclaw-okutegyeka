#!/usr/bin/env bash
set -euo pipefail

# Generate platform icons from a 1024x1024 source PNG
# Usage: ./scripts/generate-icons.sh [source.png]
# Defaults to src-tauri/icons/icon.png

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SOURCE="${1:-$PROJECT_ROOT/src-tauri/icons/icon.png}"
ICON_DIR="$PROJECT_ROOT/src-tauri/icons"

if [ ! -f "$SOURCE" ]; then
  echo "Error: source image not found: $SOURCE"
  exit 1
fi

echo "Generating icons from: $SOURCE"
echo "Output directory: $ICON_DIR"

# sips -z modifies the source file in-place even with --out, so we work from a
# temporary copy to preserve the original 1024x1024 PNG.
TMP_DIR=$(mktemp -d)
SAFE_SOURCE="$TMP_DIR/source.png"
cp "$SOURCE" "$SAFE_SOURCE"

resize() {
  # resize <size> <output_path>
  # Use -Z (resample to max dimension) instead of -z to preserve alpha/transparency
  cp "$SAFE_SOURCE" "$2"
  sips -Z "$1" "$2" >/dev/null
}

# PNG sizes needed by Tauri
resize 32 "$ICON_DIR/32x32.png"
resize 128 "$ICON_DIR/128x128.png"
resize 256 "$ICON_DIR/128x128@2x.png"

echo "  Created 32x32.png, 128x128.png, 128x128@2x.png"

# macOS .icns via iconutil
ICONSET_DIR="$TMP_DIR/icon.iconset"
mkdir -p "$ICONSET_DIR"

resize 16 "$ICONSET_DIR/icon_16x16.png"
resize 32 "$ICONSET_DIR/icon_16x16@2x.png"
resize 32 "$ICONSET_DIR/icon_32x32.png"
resize 64 "$ICONSET_DIR/icon_32x32@2x.png"
resize 128 "$ICONSET_DIR/icon_128x128.png"
resize 256 "$ICONSET_DIR/icon_128x128@2x.png"
resize 256 "$ICONSET_DIR/icon_256x256.png"
resize 512 "$ICONSET_DIR/icon_256x256@2x.png"
resize 512 "$ICONSET_DIR/icon_512x512.png"
resize 1024 "$ICONSET_DIR/icon_512x512@2x.png"

iconutil -c icns "$ICONSET_DIR" -o "$ICON_DIR/icon.icns"
echo "  Created icon.icns"

# Windows .ico
# Try magick (ImageMagick), then png2ico, then skip
if command -v magick &>/dev/null; then
  magick "$SAFE_SOURCE" -define icon:auto-resize=256,128,64,48,32,16 "$ICON_DIR/icon.ico"
  echo "  Created icon.ico (via ImageMagick)"
elif command -v convert &>/dev/null; then
  convert "$SAFE_SOURCE" -define icon:auto-resize=256,128,64,48,32,16 "$ICON_DIR/icon.ico"
  echo "  Created icon.ico (via convert)"
elif command -v png2ico &>/dev/null; then
  # png2ico requires width < 256 and multiple of 8
  TMP_ICO_DIR="$TMP_DIR/ico"
  mkdir -p "$TMP_ICO_DIR"
  resize 128 "$TMP_ICO_DIR/128.png"
  resize 48 "$TMP_ICO_DIR/48.png"
  resize 32 "$TMP_ICO_DIR/32.png"
  resize 16 "$TMP_ICO_DIR/16.png"
  png2ico "$ICON_DIR/icon.ico" "$TMP_ICO_DIR/128.png" "$TMP_ICO_DIR/48.png" "$TMP_ICO_DIR/32.png" "$TMP_ICO_DIR/16.png"
  echo "  Created icon.ico (via png2ico)"
else
  echo "  WARNING: No tool found to create icon.ico (install ImageMagick: brew install imagemagick)"
  echo "  Skipping .ico generation"
fi

rm -rf "$TMP_DIR"
echo "Done! Icons generated in $ICON_DIR"
