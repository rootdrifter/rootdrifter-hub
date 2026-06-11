# Mailgun Activation Checklist — rootdrifter.io newsletter / member email

Ghost needs a transactional email provider to send member magic-links and newsletters. The dev
instance runs `mail.transport: "Direct"` (best-effort, no auth) which is fine for local testing but
**not** deliverable in production. This checklist turns on real email via Mailgun. Do it once the
VPS + DNS are live (see `../cloudflare/DNS_SETUP.md`). For the full provider walkthrough see
`MAILGUN_SETUP.md`; this file is the short, ordered activation run-list.

> No secrets in this repo. SMTP credentials live only in the server's `config.production.json`
> (gitignored) — never commit them.

## Current state (already done, dev instance)
- [x] Membership enabled — `members_signup_access = all` (the subscribe form renders site-wide).
- [x] Default newsletter named **"rootdrifter updates"**, sender name **rootdrifter** (set via Admin API).
- [x] Site title **rootdrifter**, description set.
- [ ] Sender **address** `hello@rootdrifter.io` — **blocked on Mailgun** (cannot send from an
      unverified domain). Set this last, after domain verification below.

## Activation steps
1. **Mailgun account + domain.** Create/log in to Mailgun; add the sending domain
   **`mg.rootdrifter.io`** (a subdomain keeps the root domain's reputation isolated).
2. **DNS records** (add in Cloudflare — see `../cloudflare/DNS_SETUP.md`):
   - [ ] `TXT mg.rootdrifter.io` — SPF: `v=spf1 include:mailgun.org ~all`
   - [ ] `TXT <selector>._domainkey.mg.rootdrifter.io` — DKIM (value from Mailgun)
   - [ ] `MX mg.rootdrifter.io` → `mxa.mailgun.org` / `mxb.mailgun.org` (priority 10)
   - [ ] `TXT _dmarc.rootdrifter.io` — `v=DMARC1; p=quarantine; rua=mailto:postmaster@rootdrifter.io`
   - [ ] `CNAME email.mg.rootdrifter.io` → `mailgun.org` (tracking; optional)
3. **Verify** the domain in Mailgun (DNS propagation can take up to ~24–48h; usually minutes on Cloudflare).
4. **SMTP credentials.** Mailgun → Sending → Domain settings → SMTP credentials. Note the SMTP
   login (`postmaster@mg.rootdrifter.io`) and password — these go **only** into the server's
   `config.production.json` `mail` block (see `../config.production.template.json`):
   ```json
   "mail": { "transport": "SMTP", "options": { "service": "Mailgun",
     "host": "smtp.eu.mailgun.org", "port": 465, "secure": true,
     "auth": { "user": "[MAILGUN_SMTP_LOGIN]", "pass": "[MAILGUN_SMTP_PASSWORD]" } } }
   ```
   (Use `smtp.eu.mailgun.org` if the domain is created in the **EU** region; otherwise `smtp.mailgun.org`.)
5. **Restart Ghost** (`ghost restart`) so the mail config loads.
6. **Set the sender address** in Ghost Admin → Settings → Email newsletter → Sender email =
   `hello@rootdrifter.io` (or `noreply@mg.rootdrifter.io`); confirm the support address. (This is the
   step the integration API key cannot perform — it needs staff/owner auth in the admin UI.)
7. **Test.**
   - [ ] Admin → Email newsletter → "Send a test email" → arrives, passes SPF/DKIM (check headers).
   - [ ] Subscribe with a real address on `/subscribe/` → magic-link email arrives.
   - [ ] Mailgun dashboard shows the send as `delivered` (not `failed`/`suppressed`).
8. **Deliverability monitoring.** Watch Mailgun logs for bounces/complaints the first week; keep the
   DMARC `rua` mailbox monitored; consider moving DMARC `p=quarantine` → `p=reject` once clean.

## Rollback / notes
- If sends fail, revert `mail.transport` to `"Direct"` is **not** advised in production — instead fix
  DNS/credentials; Direct mail is near-undeliverable to most inboxes.
- Member data and newsletter content are unaffected by mail-provider changes; only delivery is.
