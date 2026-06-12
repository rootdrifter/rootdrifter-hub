#!/bin/bash
# configure-resend.sh — wire Ghost on the production host to send via Resend SMTP.
# (Replaces configure-mailgun.sh — the platform moved to Resend, 2026-06-12.)
#
# Prerequisites: a Resend account with the rootdrifter.io domain verified
# (SPF + DKIM DNS records green in the Resend dashboard) and an API key issued.
#
# Usage: ./configure-resend.sh [api_key]
#   The key may be omitted — the script prompts (silent, never echoed).
#   Requires SSH access to the production host as the ghost deploy user.
#
# Resend SMTP specifics:
#   host: smtp.resend.com   port: 587 (STARTTLS)   user: literally "resend"
#   pass: the API key       secure: MUST be boolean false (see gotcha below)
#
# ── KNOWN GOTCHA — "secure" must be a JSON boolean, not a string ─────────────
# `ghost config` writes CLI values as strings, so setting mail.options.secure
# through it produces  "secure": "false".  Nodemailer treats any non-empty
# string as TRUTHY, attempts implicit TLS-on-connect against port 587 (which
# expects STARTTLS), and every send fails with a connection/handshake error
# while the config *looks* correct.
# Fix: the value in config.production.json must be the JSON boolean
#   "secure": false
# This script writes the mail block via python json editing to guarantee the
# boolean type, instead of trusting `ghost config`.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SSH_HOST="${GHOST_SSH_HOST:-bastion-ghost}"
GHOST_DIR="/var/www/rootdrifter"
MAIL_HOST="smtp.resend.com"
MAIL_PORT=587
MAIL_USER="resend"
MAIL_FROM="rootdrifter <hello@rootdrifter.io>"

API_KEY="${1:-}"
if [ -z "$API_KEY" ]; then
  read -r -s -p "Resend API key (not echoed): " API_KEY; echo
fi
[ -n "$API_KEY" ] || { echo "Usage: $0 [api_key]"; exit 1; }

# The key travels via stdin (never in argv or env on the remote host) and the
# mail block is written with python json so "secure" lands as a true boolean.
printf '%s' "$API_KEY" | ssh "$SSH_HOST" "python3 - <<'PYEOF'
import json, os, sys
key = sys.stdin.read().strip()
path = '$GHOST_DIR/config.production.json'
cfg = json.load(open(path))
cfg['mail'] = {
    'transport': 'SMTP',
    'from': '$MAIL_FROM',
    'options': {
        'host': '$MAIL_HOST',
        'port': $MAIL_PORT,
        'secure': False,
        'auth': {'user': '$MAIL_USER', 'pass': key},
    },
}
tmp = path + '.tmp'
with open(tmp, 'w') as f:
    json.dump(cfg, f, indent=2)
os.replace(tmp, path)
print('mail block written (secure = boolean false)')
PYEOF"

ssh "$SSH_HOST" "
  export NVM_DIR=\"\$HOME/.nvm\"
  [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"
  cd $GHOST_DIR
  ghost restart
  ghost ls
"

echo
echo "Resend configured (host=$MAIL_HOST port=$MAIL_PORT user=$MAIL_USER secure=false)."
echo "Verify end-to-end (see ../EMAIL_TEST.md):"
echo "  curl -s -X POST https://rootdrifter.io/members/api/send-magic-link/ \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"<your-test-address>\",\"emailType\":\"subscribe\"}'"
echo "  -> expect HTTP 201, then the magic-link mail in the inbox (check spf/dkim pass)."
