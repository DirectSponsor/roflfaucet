# Chat System — Architecture & Cross-Site Integration

The roflfaucet chat is a custom-built, flat-file chat system. It runs on roflfaucet.com and is embedded as a widget on directsponsor.net (and potentially other sites) via iframe.

---

## Two chats — the separation

There are **two separate chat systems** in the DirectSponsor / roflfaucet world, deliberately kept apart:

- **The roflfaucet public chat (this document)** — flat-file, polling, with the bots (Anzar rainbot, ROFLBot), `/tip`, `/rain`, and the coin/faucet mechanics. It **stays non-Nostr**. It is embedded on directsponsor.net via iframe (see below). Nothing here changes.
- **The Nostr chat** — a separate layer, used only where a small, scoped group is talking: **sponsor groups**, and (planned) **fundraiser donors** who opt in to the group of a recipient they supported. Plaintext kind-9 events on our own relay (`wss://relay.directsponsor.net`), server-side signing, no browser crypto. See `sponsor-group-chat-plan.md` in the directsponsor.net project for the full plan.

**The dividing line:** the community-wide stream with bots and coin mechanics stays on the roflfaucet system; small, scoped group conversations (sponsor groups, opted-in donors) go on the Nostr layer.

**Not privacy:** the Nostr layer is *not* private — messages are plaintext on our relay and readable by anyone. It is only *scoped* to a group channel; the public chat is not "more public" than it.

---

## Architecture Overview

- **No WebSocket, no database.** Messages are stored in flat files; the client polls the API every 3 seconds.
- **No third-party chat library.** Everything is handwritten PHP + vanilla JS.
- **Cross-site embedding** is handled by a dedicated frame page + JWT passthrough (see below).

---

## Backend: `site/api/simple-chat.php`

A single PHP file handles all chat API operations.

**Storage:**
- Messages: `/var/roflfaucet-data/userdata/chat/messages.txt`
  - One line per message: `timestamp|username|message|type[|metadata_json]`
  - Capped at 100 messages; trimmed when count exceeds 150
  - File locking (dedicated `.lock` file) prevents interleaved concurrent writes
- Rate limits: `/var/roflfaucet-data/userdata/chat/ratelimit_{userId}.txt`
  - Max 10 messages per 60-second window per user
- Online presence: `/var/roflfaucet-data/userdata/chat/online.txt`
  - Users seen in the last 5 minutes are counted as online
- Notifications: `/var/roflfaucet-data/userdata/inbox/{combinedUserId}.txt`

**Endpoints:**
- `GET ?since=TIMESTAMP` — returns new messages, updates online count
- `GET ?lookup_user=TERM` — look up a user by ID or username
- `POST` with `{message, user_id, username}` — send a message or command

**Auth for writes:** reads `user_id` and `username` from POST body or GET params. This is the known exception to the session-bridge auth pattern used elsewhere — the bots (Anzar, ROFLBot) write to this API over HTTP without sessions, so full JWT/session verification isn't applied here.

**CORS:** `Access-Control-Allow-Origin: *` — required for cross-domain iframe polling.

**Commands processed server-side:**
| Command | Effect |
|---------|--------|
| `/tip username amount` | Transfers coins; updates both balances via Hub API; creates notification |
| `/rain amount` | Deducts balance, posts rain message (Anzar bot picks these up and distributes) |
| `/balance` | Returns current balance from auth server |
| `/online` | Returns online user count |
| `/help` | Lists available commands |

Balance changes go through `https://auth.directsponsor.org/api/update_balance.php` — the auth server is the single source of truth for balances.

---

## Frontend: `site/chat/chat.js`

A `ChatWidget` class. No framework dependencies.

**Key behaviour:**
- On init, reads user identity from `window.unifiedBalance` (the shared auth object used across the site)
- Guests (not logged in) get read-only view; polling still runs so they see live messages
- Polls `api/simple-chat.php?since=LAST_TIMESTAMP` every 3 seconds; only fetches new messages (bandwidth-efficient)
- Client-side message buffer: keeps 50–100 messages in the DOM, cleans up when over 200
- `@mention` detection triggers notifications server-side on send
- Two widget render modes controlled by which container ID is present in the DOM:
  - `#chat-widget-container` — full-page layout (with Notifications/Inbox tab)
  - `#sidebar-chat-widget-container` — compact sidebar layout (no Notifications tab)

**Notifications tab** (full-page only): loads from `api/simple-notifications.php`, shows tips, mentions, rain events. Supports inline reply (pre-fills `@username` into the chat input).

---

## Display Modes on roflfaucet.com

**Full page — `site/chat.html`**
Standalone chat page. Loads `chat/chat.js` and `chat/chat-widget.css`. Container is `#chat-widget-container`.

**Sidebar embed — `includes/chat-sidebar.html`**
Included in sidebar via the build system. Wraps a `#sidebar-chat-widget-container` div inside a `<details>` element. `chat.js` detects this container and renders the compact layout. A "Open Full Chat →" link points to `chat.html`.

---

## Cross-Site Embedding: `site/chat-widget-frame.php`

This file is the bridge for embedding the chat on other domains.

**Problem:** Browsers block cross-origin iframe access to `localStorage`/`sessionStorage` and cookies. A DS user logged in at `directsponsor.net` has their JWT in DS's storage — the roflfaucet iframe has no access to it.

**Solution:** JWT passthrough via URL param.

1. The embedding page reads the JWT from its own `sessionStorage`/`localStorage`
2. Builds the iframe src as `https://roflfaucet.com/chat-widget-frame.php?jwt=ENCODED_JWT`
3. `chat-widget-frame.php` reads the JWT from `$_GET['jwt']`, decodes it server-side (PHP), and injects `username` + `userId` into the page as a JS snippet
4. That snippet fakes `window.unifiedBalance` — the object `chat.js` uses to identify the logged-in user
5. `chat.js` sees a logged-in user and enables full chat participation

**iframe embedding headers on `chat-widget-frame.php`:**
```
X-Frame-Options: ALLOWALL
Content-Security-Policy: frame-ancestors *
```
Without these, browsers refuse to render roflfaucet pages inside another site's iframe.

**If no JWT is passed** (user not logged in on the embedding site): the iframe loads without the snippet, `window.unifiedBalance` is absent, and `chat.js` falls back to guest (read-only) mode.

---

## How directsponsor.net Embeds It

Every DS page has a floating chat button (bottom-right corner). The panel is hidden by default if the user closed it within the last 60 minutes (stored in `localStorage` as `ds-chat-closed`).

**HTML structure (in each page, injected via CMS include):**
```html
<div id="chat-float-panel" class="chat-float-panel open">
    <div class="chat-float-panel-inner">
        <div class="chat-float-panel-header">
            💬 Community Chat
            <span>via <a href="https://roflfaucet.com/chat.html">roflfaucet.com ↗</a></span>
        </div>
        <div class="chat-float-frame-wrap">
            <iframe id="chat-float-frame" src="" ...></iframe>
        </div>
        <div id="chat-float-login" style="display:none;">
            <a href="...">Log in to join the chat</a>
        </div>
    </div>
</div>
<button id="chat-float-btn" onclick="dsToggleChat()">✕</button>
```

**The iframe `src` is set by JS, not hardcoded** — this defers the network request until the panel is actually open:
```js
var jwt = sessionStorage.getItem('jwt') || localStorage.getItem('jwt');
frame.src = jwt
    ? 'https://roflfaucet.com/chat-widget-frame.php?jwt=' + encodeURIComponent(jwt)
    : 'https://roflfaucet.com/chat-widget-frame.php';
```

**CSS** (in `directsponsor-compact.css`): fixed-position panel, 22em wide, 460px tall. On mobile (`max-width: 40em`) it expands to full width and 70vh.

---

## Bot Integration

The bots (Anzar Rainbot, ROFLBot) write to the same `simple-chat.php` API directly over HTTP, posting `user_id` and `username` as params. They are the known exception to the session auth pattern — no JWT or session cookie, just the API params. Bot usernames (`anzar`, `roflbot`) are reserved by convention; no enforcement mechanism currently exists.

---

## Files Summary

| File | Purpose |
|------|---------|
| `site/api/simple-chat.php` | All chat API logic (read, write, commands, rate limiting) |
| `site/chat/chat.js` | `ChatWidget` class — polling, rendering, notifications |
| `site/chat/chat-widget.css` | Chat widget styles |
| `site/chat.html` | Full-page chat on roflfaucet.com |
| `site/chat-widget-frame.php` | Embeddable iframe page with JWT passthrough |
| `includes/chat-sidebar.html` | Sidebar embed snippet (built into RF pages) |
| `site/api/simple-notifications.php` | Notifications read/write API |

**On directsponsor.net:**

| File | Purpose |
|------|---------|
| `site/cms/includes/social-layout-end.incl` | Contains the floating chat panel HTML + JS (included in all pages) |
| `site/styles/directsponsor-compact.css` | `.chat-float-*` styles |

---

## Related

- `sponsor-group-chat-plan.md` (directsponsor.net project) — the current plan for the **Nostr group chat** (sponsor groups + opted-in fundraiser donors). This is the other half of the "two chats" split above.
- [[chat-private-messaging-outline]] — older draft; the "small private groups" part is superseded by `sponsor-group-chat-plan.md`. The 1:1 DM scope is dormant, not cancelled. Covers key handling, relay strategy.
- [[nostr-integration]] — the strfry relay (`wss://relay.directsponsor.net`) the Nostr chat would use.
