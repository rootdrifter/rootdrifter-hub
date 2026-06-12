# EMAIL_TEST — verifying Ghost email end-to-end (Resend SMTP)

Exact procedure to verify production email without guessing. Every step below was run
and verified on 2026-06-12. Provider: **Resend SMTP** (`smtp.resend.com:587`, STARTTLS,
user `resend`, password = API key, `secure: false` **as a JSON boolean** — see the
gotcha in `scripts/configure-resend.sh`).

## 1. Verify the transport config (no send, credentials never printed)

```bash
ssh bastion-ghost "python3 -c \"
import json
c = json.load(open('/var/www/rootdrifter/config.production.json'))
m = c.get('mail', {}); o = m.get('options', {})
print('transport:', m.get('transport'))
print('from:', m.get('from'))
print('host:', o.get('host'), 'port:', o.get('port'))
print('secure:', o.get('secure'), type(o.get('secure')).__name__)   # must be: False bool
print('auth set:', bool(o.get('auth',{}).get('user')), bool(o.get('auth',{}).get('pass')))
\""
```

Expected: `transport: SMTP`, `host: smtp.resend.com port: 587`, **`secure: False bool`**
(if this prints `false str`, sends fail with handshake errors — fix the boolean), auth both `True`.

## 2. Fire a real send — the subscribe magic link

This is the public members endpoint the subscribe form posts to, so it tests the full
path: members API → Ghost mail → Resend SMTP → inbox.

```bash
curl -s -X POST "https://rootdrifter.io/members/api/send-magic-link/" \
  -H "Content-Type: application/json" \
  -d '{"email": "hello@rootdrifter.io", "emailType": "subscribe"}' \
  -w "\nHTTP %{http_code}\n"
```

Expected: `HTTP 201` and a response time over ~1 s (the SMTP transaction is synchronous —
2026-06-12 measurement: 1625 ms). A sub-100 ms 201 would suggest the send was queued or
skipped; investigate the journal.

Notes:
- Sending the link does **not** create a member — the member is created only when the
  link is clicked. Safe to fire at an operator-owned address.
- Clicking the link completes signup and redirects to `/welcome/`
  ("// TRANSMISSION RECEIVED" — the Free tier's `welcome_page_url`).

## 3. Confirm the send in the journal (catches silent SMTP failures)

```bash
ssh bastion-ghost "sudo journalctl -u ghost_rootdrifter-io --since '10 minutes ago' \
  --no-pager | grep -iE 'magic|mail|smtp|error' | tail -5"
```

Expected: the `POST /members/api/send-magic-link/ 201` line and **no** ERROR lines
mentioning mail/SMTP. A misconfigured transport shows
`EmailError`/`connection`/`handshake` errors here even when the HTTP response was 201.

## 4. Inbox checks (operator)

In the received message's raw headers: `spf=pass`, `dkim=pass` for the sending domain.
If the mail lands in spam, re-check the Resend dashboard's domain DNS records.

## What does NOT work (so future sessions stop rediscovering it)

- `POST /ghost/api/admin/email_preview/newsletter/` — endpoint does not exist (404).
- `POST /ghost/api/admin/email_previews/posts/<id>/` (the admin "send test newsletter")
  — **staff-token only**; integration API keys get 403. Test newsletter sends must be
  done from the admin UI, or use the magic-link method above.
- Newsletter `subject_prefix` — not a Ghost field; core Ghost has no subject prefix.
- A "welcome email" — core Ghost has no welcome-email feature. The platform's
  equivalent is the `/welcome/` page wired as the Free tier `welcome_page_url`.

## Outbound-port caveat (2026-06-12 incident)

Egress from the box is restricted at the Hetzner level: only 587/465 outbound were open
on 2026-06-12 (443/80/53-tcp blocked). Email works through this; anything else outbound
(ACME renewal, apt, Ghost update pings, the old through-Cloudflare health probe) fails
until the cloud firewall is fixed. The health check now probes loopback for this reason.
