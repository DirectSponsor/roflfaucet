# ROFLFaucet
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/DirectSponsor/roflfaucet)

**Live site: [roflfaucet.com](https://roflfaucet.com/)**

A faucet and gaming site where players earn UselessCoins for charity by playing browser-based games. Coins can be directed to charitable causes via the DirectSponsor ecosystem.

## Features

- **Games**: Slots, Wheel, Roll, Poker Dice
- **Bitcoin Lightning** payment integration
- **Role-based admin** system (admin, moderator, recipient, member)
- **User profiles** with file-based storage
- **Charity projects** — fundraisers live on [directsponsor.net](https://directsponsor.net) (removed from roflfaucet 2026-10-21)
- **Balance manipulation detection** — analytics-based fraud prevention
- **Multi-server sync** via Syncthing

## Tech Stack

- PHP / Apache
- File-based storage (no database) — user data in `/var/roflfaucet-data/`
- Session-based authentication
- Bitcoin Lightning (webhooks)
- JavaScript front-end games

## Documentation

Auto-generated wiki: [deepwiki.com/DirectSponsor/roflfaucet](https://deepwiki.com/DirectSponsor/roflfaucet)
