#!/usr/bin/env bash
# health-check.sh — verify a Ghost site is up, returns HTTP 200, and serves the expected title.
# Usage: ./health-check.sh [URL] [EXPECTED_TITLE_SUBSTRING]
# Exit 0 = healthy, 1 = unhealthy (suitable for cron/monitoring/systemd ExecStartPost).
set -uo pipefail

URL="${1:-http://localhost:2368}"
EXPECT="${2:-rootdrifter}"
# RETRIES/DELAY give a just-restarted Ghost time to finish booting before we call it unhealthy
# (Ghost returns 503 for a few seconds after `ghost restart`). For pure monitoring set RETRIES=1.
RETRIES="${RETRIES:-6}"
DELAY="${DELAY:-3}"

code="000"
for i in $(seq 1 "$RETRIES"); do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$URL/")" || code="000"
  [ "$code" = "200" ] && break
  [ "$i" -lt "$RETRIES" ] && sleep "$DELAY"
done
if [ "$code" != "200" ]; then
  echo "UNHEALTHY: $URL returned HTTP $code after $RETRIES attempt(s)"
  exit 1
fi

title="$(curl -s --max-time 10 "$URL/" | grep -oiE '<title>[^<]*</title>' | head -1)"
if ! echo "$title" | grep -qi "$EXPECT"; then
  echo "UNHEALTHY: HTTP 200 but title missing '$EXPECT' (got: ${title:-<none>})"
  exit 1
fi

echo "HEALTHY: $URL  HTTP 200  ${title}"
exit 0
