# Removing the on-site donation system (Coinos) — scoping doc

Created 2026-10-21. Status: **proposed, not started**. Separate project from the es7
security clean-up (`~/work/security/es7-unknown-remote-agent-2026-10-20.md`), which only
needs the Coinos key *rotated or deleted* — this doc is about removing the feature.

## Why

- Donations now have a home: directsponsor.net. Two donation systems is one too many.
- The Coinos API key + webhook secret are the only money-bearing secrets left on es7, and
  they were exposed in the es7 incident. No key is better than a rotated key.
- Less code: two APIs, a webhook router, a modal/keypad UI, ledgers, admin entry page, a
  monthly distribution job, plus an archive folder of older attempts.

## What exists today (from repo grep, 2026-10-21 — verify on es7 before removing)

Per `DONATION_SYSTEM_ARCHITECTURE.md` there are two Coinos-backed systems:

| Piece | Path (under `site/`) | Notes |
|---|---|---|
| Site income API | `api/site-income-api.php` | general fund, site's own Coinos key |
| Project donations API | `api/project-donations-api.php` | per-project Coinos keys |
| Webhook router | `webhook.php` | `https://roflfaucet.com/webhook.php` — Coinos calls this |
| Manual payment entry | `api/record-manual-payment.php`, `admin-payment-entry.html` | admin |
| Donate UI | `site-income/donate.html` (+ modal/keypad JS, find via build includes) | |
| Server-side variant | `api/server-versions/project_payment.php` | |
| Migration helper | `migrate-server-distribution-data.php` | one-off? |
| Old attempts | `archive-donation-systems-20251011/` | already archived, delete |
| Secrets | `/var/roflfaucet-data/payments/.env` on es7 (`COINOS_API_KEY`, `COINOS_WEBHOOK_SECRET`, `COINOS_WEBHOOK_URL`) + `.env.working-backup`, `.env.example` | |
| Ledgers | `/var/roflfaucet-data/data/donations/` (?), `/var/roflfaucet-data/projects/` | keep an archive copy before deletion |

Related docs to retire or mark historical when done: `DONATION_SYSTEM_ARCHITECTURE.md`,
`PAYMENT_SYSTEM_INVESTIGATION.md`, `BITCOIN_LIGHTNING_PAYMENT_SYSTEM.md`,
`FINANCIAL_REPORTING_SYSTEM.md`, `docs/PROJECT_DONATIONS_SYSTEM.md`,
`docs/PROJECT_ALLOCATION_SYSTEM.md`.

## Coinos keys — where they live (gotcha)

Coinos shows an account's auth tokens on **coinos.io/docs** (while logged in), *not* under
Settings. Each account has a full-access token and a read-only token; they share most of
their characters and differ in the last ~30. The read-only one can create invoices (receive)
and read balances but cannot send — so a leaked read-only token is low risk.
2026-10-21: the token in es7's `payments/.env` ends `...iOg` (168 chars) and does NOT match
either ClickForCharity-wallet token (`...oOM` full, `...BG8` read-only) → it belongs to
another account or was re-issued. Checked all accounts: no match. `GET /api/me` with it →
**401** — the token is dead. No rotation needed; the donation system has been
non-functional (consistent with `PAYMENT_SYSTEM_INVESTIGATION.md`, Jan 2026). Phase 0
below reduces to "delete the `.env` files when removing the feature".

## Open questions (andy)

1. Which Coinos account does the es7 token (`...iOg`) belong to? Is it the read-only one?
   Any balance to withdraw before the account/key is closed?
2. Does anything *besides* donations use Coinos on roflfaucet (user payouts, tips)? If not,
   Coinos goes entirely.
3. "Project allocation" / monthly distribution: is that still meaningful without donations,
   or does it go too?
4. UI: replace Donate with a link/short page pointing at directsponsor.net, or remove the
   concept from the nav entirely?
5. Are there donation records worth keeping for reporting (`FINANCIAL_REPORTING_SYSTEM.md`)?

## Plan (phases, each shippable on its own)

0. **Now (security):** rotate or revoke the Coinos API key in the Coinos dashboard; if
   revoked, delete `/var/roflfaucet-data/payments/.env*` on es7. Do this regardless of the
   rest — it's minutes, and it closes the money-risk from the incident.
1. **Inventory on es7:** confirm the table above against the live web root, find every page
   that includes the donate UI (`grep -rl donate site/` + `build.sh` includes), export the
   ledgers to `~/security-evidence/` or a dated archive.
2. **Front end:** remove donate modal/buttons/includes; add the directsponsor.net link where
   it makes sense; `build.sh`; `deploy.sh`; changelog entry.
3. **Back end:** delete the APIs, webhook, admin entry, archive folder; remove any cron for
   monthly distribution; remove Coinos `.env`. Check Apache logs for a week for 404s on
   the removed paths (bots/old links).
4. **Docs:** mark the donation docs historical (one line at top), update `AGENTS.md`
   "Key Systems", update `CURRENT_SYSTEM_STATE.md`.

## Related es7 work tracked elsewhere (infra, not this project)

- `~/work/security/es7-unknown-remote-agent-2026-10-20.md` — the incident, every key/secret
  rotation done, and the open items: **purge MySQL packages ~2026-10-28** if nothing
  complained (`apt purge mysql-server* && apt autoremove`; final dump in `/root/backups/`),
  and the **es7 rebuild decision** (clean reinstall vs keep; evidence says agent was
  andy's own, so low urgency — if rebuilding, use `~/work/backup-system/restore/
  es7-roflfaucet-listmonk.md` and set `PermitRootLogin prohibit-password`).
- `~/work/monitors/status/README.md` — status-json pilot, es7 first (paused for the above).

## Progress log

- 2026-10-21: doc created after the es7 secrets inventory. Nothing removed yet.
- 2026-10-21: backup of es7 /var/www/html + /var/roflfaucet-data (incl. payments/.env) -> ~/backups/roflfaucet-deploys/pre-donations-removal-2026-10-21.tar.gz (contains secrets, mode 600). Repo removal done: donate/fundraiser/project/accounts/transparency pages, Coinos APIs, webhook, charity-pot widget, nav Donate + Transparency links, profile project UI. NOT yet deployed (deploy.sh will ask to confirm deletions). Server-side TODO after deploy: delete /var/roflfaucet-data/payments/.env*, remove monthly distribution cron, archive+remove data/projects dirs, watch Apache 404s. Decisions: kept admin-roles/user-roles (role system) for now; no directsponsor.net link yet; clickforcharity wallet donates on directsponsor.net instead (see AGENTS.md).
- 2026-10-21: andy ran deploy.sh (repo removal now live). Project/fundraiser/donation functionality now lives on directsponsor.net (this system was its starting point).

## TODO (remaining)

1. Server cleanup on es7: delete /var/roflfaucet-data/payments/.env*, remove monthly distribution cron, archive then remove data/projects and data/donations dirs (backup already taken).
2. Watch Apache logs ~1 week for 404s on removed paths (webhook.php, site-income.html, transparency.html, fundraiser*.html, api/*).
3. Retire leftovers: recipient role in user-roles.js/css and admin-roles.html (decision pending); old Coinos mentions in README.md/TODO.md; commit the repo changes.
4. LATER (design discussion): a ClickForCharity accounts/presentation page on roflfaucet, pulling data from https://directsponsor.net/profile.html?user=clickforcharity (public, works logged out; terse list with amount, date, link to the fundraiser; fundraiser page links to recipient profile). Needs only a read-only fetch/scrape of public pages, no API/webhook. Open questions: scrape vs. a small JSON endpoint on directsponsor.net, cache, CORS, where it links from on roflfaucet.
