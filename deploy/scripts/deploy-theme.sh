#!/usr/bin/env bash
# deploy-theme.sh — validate and deploy the rootdrifter theme to a Ghost install.
# Usage: ./deploy-theme.sh [GHOST_DIR]
#   GHOST_DIR defaults to the local dev instance. On the VPS pass /var/www/ghost.
#
# Steps: gscan (fail on errors) -> copy theme -> restart Ghost -> health check.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
THEME_SRC="$REPO_DIR/theme"
GHOST_DIR="${1:-/home/exiled/ghost/rootdrifter-dev}"
THEME_DST="$GHOST_DIR/content/themes/rootdrifter"

echo "[1/4] gscan validation"
# gscan exits non-zero on errors; warnings (e.g. custom-fonts) are acceptable.
npx --yes gscan "$THEME_SRC" || { echo "gscan reported errors — aborting."; exit 1; }

echo "[2/4] deploy theme + routes -> $GHOST_DIR"
mkdir -p "$THEME_DST"
cp -r "$THEME_SRC/." "$THEME_DST/"
if [ -f "$REPO_DIR/routes.yaml" ]; then
  cp "$REPO_DIR/routes.yaml" "$GHOST_DIR/content/settings/routes.yaml"
fi

echo "[3/4] restart Ghost"
( cd "$GHOST_DIR" && ghost restart )

echo "[4/4] health check"
"$(dirname "${BASH_SOURCE[0]}")/health-check.sh" "${GHOST_URL:-http://localhost:2368}"
echo "Theme deployed."
