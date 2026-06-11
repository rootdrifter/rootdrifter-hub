#!/usr/bin/env bash
# backup-ghost.sh — timestamped tar.gz of a Ghost content/ directory (db, images, themes, settings).
# Usage: ./backup-ghost.sh [GHOST_CONTENT_DIR] [BACKUP_DIR]
# Cron example (daily 03:30, keep 14 days):
#   30 3 * * * /var/www/ghost/scripts/backup-ghost.sh /var/www/ghost/content /var/backups/ghost
set -euo pipefail

CONTENT_DIR="${1:-/home/exiled/ghost/rootdrifter-dev/content}"
BACKUP_DIR="${2:-/home/exiled/github/backups}"
RETAIN_DAYS="${RETAIN_DAYS:-14}"

[ -d "$CONTENT_DIR" ] || { echo "content dir not found: $CONTENT_DIR"; exit 1; }
mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="$BACKUP_DIR/ghost-content-$STAMP.tar.gz"

# Exclude regenerable caches; keep data/, images/, settings/, themes/.
tar -czf "$ARCHIVE" \
  --exclude='*/logs/*' \
  -C "$(dirname "$CONTENT_DIR")" "$(basename "$CONTENT_DIR")"

echo "backup: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"
gzip -t "$ARCHIVE" && echo "integrity: OK"

# Prune old backups.
find "$BACKUP_DIR" -name 'ghost-content-*.tar.gz' -mtime "+$RETAIN_DAYS" -print -delete
