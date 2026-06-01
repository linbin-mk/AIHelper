#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Building AIHelper Release Packages ==="
echo ""

echo "[1/4] Syncing shared files..."
bash sync.sh
echo ""

echo "[2/4] Packaging Chrome (Chromium) extension..."
cd chrome-extension
zip -r ../release/AIHelper-chrome.zip . -x "*.DS_Store" > /dev/null
cd ..
echo "  → release/AIHelper-chrome.zip"
echo "  (Chrome / Edge / Opera 通用)"
echo ""

echo "[3/4] Packaging Firefox extension..."
cd firefox-extension
zip -r ../release/AIHelper-firefox.zip . -x "*.DS_Store" -x "spike/*" > /dev/null
cd ..
echo "  → release/AIHelper-firefox.zip"
echo ""

echo "[4/4] Packaging source code..."
find . \
  -path './.git' -prune -o \
  -path './.git/*' -prune -o \
  -path './.kilocode' -prune -o \
  -path './.kilocode/*' -prune -o \
  -path './release' -prune -o \
  -path './release/*' -prune -o \
  -path './openspec' -prune -o \
  -path './openspec/*' -prune -o \
  -path './chrome-extension/src/shared' -prune -o \
  -path './chrome-extension/src/shared/*' -prune -o \
  -path './firefox-extension/src/shared' -prune -o \
  -path './firefox-extension/src/shared/*' -prune -o \
  -path './firefox-extension/src/content' -prune -o \
  -path './firefox-extension/src/content/*' -prune -o \
  -path './chrome-extension/skills' -prune -o \
  -path './chrome-extension/skills/*' -prune -o \
  -path './firefox-extension/skills' -prune -o \
  -path './firefox-extension/skills/*' -prune -o \
  -name '.DS_Store' -prune -o \
  -name '.gitignore' -prune -o \
  -name 'AGENTS.md' -prune -o \
  -name 'build.sh' -prune -o \
  -name 'kilo.json' -prune -o \
  -type f -print \
  | zip release/AIHelper-source.zip -@ > /dev/null
echo "  → release/AIHelper-source.zip"
echo ""

echo "=== Done ==="
ls -lh release/*.zip
