# Mailgun Setup — transactional email for rootdrifter.io

Full provider walkthrough for wiring Mailgun into Ghost so member magic-links and newsletters deliver.
For the short ordered go-live list see `ACTIVATION_CHECKLIST.md`; for the DNS records see
`../cloudflare/DNS_SETUP.md`.

> No credentials in this repo. SMTP login/password live only in the VPS `config.production.json`
> (gitignored). This guide uses `[PLACEHOLDERS]`.

## 1. Account + sending domain
- Create a Mailgun account; verify it (Mailgun requires a payment method even on the free tier to send
  to unverified recipients). Choose the **EU** region if EU data residency matters — it changes the
  SMTP host to `smtp.eu.mailgun.org` and the API base.
- Add a **sending domain**: `mg.rootdrifter.io` (a dedicated subdomain protects the apex's reputation).

## 2. Domain verification (DNS)
Add the records Mailgun shows for the domain (also catalogued in `../cloudflare/DNS_SETUP.md`):
- **SPF** — `TXT mg` → `v=spf1 include:mailgun.org ~all`
- **DKIM** — `TXT <selector>._domainkey.mg` → the public key Mailgun generates
- **MX** — `mg` → `mxa.mailgun.org`, `mxb.mailgun.org` (priority 10) — needed for bounce handling
- **Tracking (optional)** — `CNAME email.mg` → `mailgun.org`
Keep all of these **DNS-only** (grey cloud) in Cloudflare. Click **Verify** in Mailgun; propagation on
Cloudflare is usually minutes. Don't proceed until the domain shows **Verified / Active**.

## 3. SMTP credentials
Mailgun → Sending → Domain settings → **SMTP credentials**. Default login is
`postmaster@mg.rootdrifter.io`; reset the password to generate one. Record:
- Host: `smtp.eu.mailgun.org` (or `smtp.mailgun.org` for US region)
- Port: `465` (SSL) or `587` (STARTTLS)
- User: `[MAILGUN_USER]`  ·  Pass: `[MAILGUN_PASS]`

These go **only** into the server `config.production.json` `mail` block (template:
`../config.production.template.json`). Never paste them anywhere tracked by git.

## 4. Ghost integration
With the `mail` block filled, restart Ghost (`ghost restart`). Then in **Ghost Admin → Settings →
Email newsletter**:
- **Sender email:** `hello@rootdrifter.io` (or `noreply@mg.rootdrifter.io`). The reply-to can be the
  human-facing address.
- **Support address:** `hello@rootdrifter.io`.
- Newsletter name is already **"rootdrifter updates"**, sender name **rootdrifter**.
> These admin-UI steps can't be done with an integration API key (staff-only); do them logged in as Owner.

## 5. Test procedure
- Admin → Email newsletter → **Send a test email** → confirm arrival; inspect headers for
  `spf=pass` and `dkim=pass`.
- Subscribe a real address at `https://rootdrifter.io/subscribe/` → the magic-link email should arrive
  within seconds; clicking it signs the member in.
- Mailgun → **Logs**: the send should read `delivered` (not `failed`/`suppressed`).

## 6. Sender address, bounces, deliverability
- **Sender consistency:** always send from the verified `mg.rootdrifter.io` domain; a mismatch fails
  DMARC and lands in spam.
- **Bounce handling:** the MX records let Mailgun process bounces; it auto-adds hard-bounces to the
  **Suppressions** list. Review Suppressions periodically; clean invalid addresses from members.
- **Deliverability monitoring (first weeks):** watch Mailgun's delivered/bounce/complaint rates; keep
  the DMARC `rua` mailbox monitored; warm up volume gradually. Once bounce/complaint rates are low and
  stable, tighten DMARC from `p=quarantine` to `p=reject`.
- **Volume:** a low-frequency personal newsletter sits comfortably in Mailgun's free/flex tier; confirm
  the current monthly limit before a large send.
