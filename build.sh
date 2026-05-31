#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Building AIHelper Release Packages ==="
echo ""

echo "[1/3] Syncing shared files..."
bash sync.sh
echo ""

echo "[2/3] Packaging Chrome (Chromium) extension..."
cd chrome-extension
zip -r ../release/AIHelper-chrome.zip . -x "*.DS_Store" > /dev/null
cd ..
echo "  → release/AIHelper-chrome.zip"
echo "  (Chrome / Edge / Opera 通用)"
echo ""

echo "[3/3] Packaging Firefox extension..."
cd firefox-extension
zip -r ../release/AIHelper-firefox.zip . -x "*.DS_Store" -x "spike/*" > /dev/null
cd ..
echo "  → release/AIHelper-firefox.zip"
echo ""

echo "=== Done ==="
ls -lh release/*.zip
