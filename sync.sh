#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "Syncing shared files..."

echo "  shared/ -> chrome-extension/src/shared/"
mkdir -p chrome-extension/src/shared
rsync -a --delete shared/ chrome-extension/src/shared/

echo "  shared/ -> firefox-extension/src/shared/"
mkdir -p firefox-extension/src/shared
rsync -a --delete shared/ firefox-extension/src/shared/

echo "  skills/ -> chrome-extension/skills/"
mkdir -p chrome-extension/skills
rsync -a --delete skills/ chrome-extension/skills/

echo "  skills/ -> firefox-extension/skills/"
mkdir -p firefox-extension/skills
rsync -a --delete skills/ firefox-extension/skills/

echo "  chrome-extension/src/content/ -> firefox-extension/src/content/"
mkdir -p firefox-extension/src/content
rsync -a --delete chrome-extension/src/content/ firefox-extension/src/content/

echo "Done! All shared files synced."
