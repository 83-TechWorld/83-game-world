#!/usr/bin/env bash
# Makes one finished promo video: records the game, renders 1080x1920, adds voiceover, music and sound effects.
# Usage: ./make.sh <game-slug>      e.g. ./make.sh spell-gaps
set -euo pipefail
cd "$(dirname "$0")"
GAME="$1"

echo "1/4 building the site"
(cd ../../.. && npm run build >/dev/null)

echo "2/4 recording real gameplay"
node record.cjs "$GAME"

echo "3/4 rendering 1080x1920"
node render.cjs "$GAME" meta
node render.cjs "$GAME"

echo "4/4 adding voiceover, music and sound effects"
.venv/bin/python audio.py "$GAME"

cp "out/$GAME/$GAME-short-audio.mp4" "../$GAME-short.mp4"
echo "done: marketing/shorts/$GAME-short.mp4"
