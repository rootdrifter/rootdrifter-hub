#!/bin/bash
# configure-mailgun.sh — wire Ghost on the production host to send via Mailgun EU SMTP.
# Run AFTER the Mailgun account exists, mg.rootdrifter.io is Verified, and SMTP
# credentials are issued (see ../mailgun/ACTIVATION_CHECKLIST.md steps 1-4).
#
# Usage: ./configure-mailgun.sh [smtp_user] [smtp_pass]
#   Args may be omitted — the script prompts (password prompt is silent, never echoed).
#   Requires SSH access to the production host as the ghost deploy user.
set -euo pipefail

SSH_HOST="${GHOST_SSH_HOST:-bastion-ghost}"
GHOST_DIR="/var/www/rootdrifter"
MAIL_HOST="smtp.eu.mailgun.org"   # EU region; use smtp.mailgun.org if the domain is US-region
MAIL_PORT=465

SMTP_USER="${1:-}"
SMTP_PASS="${2:-}"
if [ -z "$SMTP_USER" ]; then
  read -r -p "Mailgun SMTP login (e.g. postmaster@mg.rootdrifter.io): " SMTP_USER
fi
if [ -z "$SMTP_PASS" ]; then
  read -r -s -p "Mailgun SMTP password (not echoed): " SMTP_PASS; echo
fi
[ -n "$SMTP_USER" ] && [ -n "$SMTP_PASS" ] || { echo "Usage: $0 [smtp_user] [smtp_pass]"; exit 1; }

# %q-quote values so special characters survive the remote shell safely
Q_USER=$(printf '%q' "$SMTP_USER")
Q_PASS=$(printf '%q' "$SMTP_PASS")

ssh "$SSH_HOST" "
  export NVM_DIR=\"\$HOME/.nvm\"
  [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"
  cd $GHOST_DIR
  ghost config --mail SMTP \
    --mailservice Mailgun \
    --mailuser $Q_USER \
    --mailpass $Q_PASS \
    --mailhost $MAIL_HOST \
    --mailport $MAIL_PORT
  ghost restart
  ghost ls
"

echo
echo "Mailgun configured (host=$MAIL_HOST port=$MAIL_PORT user=$SMTP_USER)."
echo "Next (operator, in Ghost admin -> Settings -> Email newsletter):"
echo "  1. Set sender email (hello@rootdrifter.io) + support address"
echo "  2. Send a test email; check headers for spf=pass / dkim=pass"
echo "  3. Subscribe a real address at /subscribe/ -> magic link should arrive"
