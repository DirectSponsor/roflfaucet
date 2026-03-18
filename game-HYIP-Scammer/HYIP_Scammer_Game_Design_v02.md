# HYIP Scammer Game
## Game Design Document v0.2
*A RoflFaucet Mini-Game | February 2026*

*Changes from v0.1: reserve visibility, operator stake guidance, HYIP Monitor tab, investor information model*

---

## 1. Overview

HYIP Scammer is a multiplayer educational game hosted on RoflFaucet.com. Players participate in a simulated economy of High-Yield Investment Program (HYIP) scams — the kind of Ponzi schemes that have defrauded real people out of real Bitcoin since the early days of crypto. By letting players both run schemes and fall victim to them, the game teaches how these scams work through direct experience rather than explanation.

The tone is entirely on-brand for RoflFaucet: the game is openly advertised as a complete scam, which is precisely what makes it safe and educational. All currency is RoflFaucet's existing in-game currency. No real money is ever at risk, and players can always claim more from the faucet — so the game is designed for maximum authenticity rather than player protection. The experience should feel as close to the real thing as possible.

---

## 2. Core Concept

The game has two roles that any player can occupy at different times:

**Investor:** Browse active HYIP schemes, analyse their parameters and public reputation signals, decide whether to invest — and try to withdraw before the scheme collapses.

**Operator ("Scammer"):** Design and launch your own scheme, setting interest rates, duration, referral bonuses, and advertising spend. Attract investors, pay out early ones to build trust, then either pull the rug deliberately or let the scheme grow as long as your reserve holds.

The central tension is informational asymmetry: operators see their true reserve; investors never do. Investors must rely on the same indirect signals that real HYIP punters use. This mirrors real HYIP dynamics exactly, and is a core design principle throughout.

---

## 3. Currency

All transactions use RoflFaucet's existing in-game currency (Rofl Coins). New players receive a small daily faucet drip to seed their first investments. There is no conversion to or from any real-world currency — the economy is entirely self-contained. Because coins are free and always available from the faucet, there is no need to protect players from loss. The game should lean into this: high rates, dramatic collapses, and maximum chaos are features, not problems.

---

## 4. Player Roles & Progression

### 4.1 New Player
Arrives with zero balance. Claims from the faucet to get started. Can immediately browse and invest in active schemes. Cannot create a scheme until they hold the minimum operator stake.

### 4.2 Investor
Any player with a positive balance can invest. The investor experience centres on reading scheme listings, evaluating risk signals through the HYIP Monitor tab (see Section 8), timing entry and exit, and managing a portfolio spread across multiple schemes simultaneously.

### 4.3 Operator
A player who has accumulated the minimum operator stake can create a new scheme, funding its initial reserve from their own balance. Managing the scheme requires active involvement: monitoring inflow, processing payouts (automated or manual per their settings), and deciding when — or whether — to pull the rug. The option to collapse the scheme deliberately is always available.

---

## 5. Operator Stake & Guidance

Rather than enforcing a hard minimum reserve that blocks creativity, the game guides operators toward sensible funding through a live **Projected Lifespan Calculator** on the scheme creation form. As the operator adjusts their parameters, the calculator shows a real-time estimate of how long the scheme is likely to survive at those settings, based on typical investment volumes for similar schemes.

For example: setting a 10% daily rate with a 500-coin seed reserve would show a projected lifespan of roughly 2–3 days. The operator is free to launch it anyway — a fast, chaotic scheme that collapses in days is a perfectly valid (and very authentic) play style. But they go in informed.

A soft minimum stake is still enforced to prevent throwaway spam schemes with literally zero reserve — this figure should be set low enough to be easily achievable from a few days of faucet use, but high enough that launching requires some intent.

> **Design note:** The minimum stake figure needs playtesting to set correctly. A suggested starting point is 500 coins — roughly 3–5 days of faucet income for a new player. This keeps the barrier low while ensuring operators have skin in the game.

Real HYIP operators typically seed their scheme with enough to pay out the first wave of investors convincingly, then rely on new investment inflow to cover ongoing payouts. This is the model the calculator should illustrate. Operators who launch underfunded schemes will quickly develop a reputation for fast rugs, which itself becomes a meaningful game signal for investors.

---

## 6. Scheme Parameters

When launching a scheme the operator fills in a creation form. Each parameter is a real game mechanic — the combination of choices determines the scheme's viability, attractiveness, and likely lifespan.

| Parameter | Description | Typical Real Values |
|---|---|---|
| Scheme Name | Display name shown on listings and the Monitor tab | "CryptoGain Pro", "SatoshiVault 2.0" |
| Theme / Legend | Fake business model presented to investors | Forex trading, Crypto arbitrage, Cloud mining, AI bot, Real estate fund |
| Investment Unit Size | Minimum coins per investment slot | 100, 500, 1000 coins |
| Daily Interest Rate | % paid per day — higher = more attractive, faster drain | 1%–3% (low), 3%–10% (medium), 10%+ (fast-collapse) |
| Plan Duration | Days until principal + total interest is returned | 7, 14, 30, 90 days |
| Referral Bonus | % bonus for referring a new investor | 0%, 3%, 5% |
| Withdrawal Mode | Controls how quickly investors can exit — key trust signal | Instant / 24h delay / Manual approval |
| Proof of Payments Feed | Operator toggles a live feed of recent payouts on their public listing | On / Off |
| Advertising Budget | Coins spent from reserve to boost listing placement; drains reserve faster | 0 to N coins (operator's choice) |
| Initial Reserve | Operator's own coins seeding the scheme | Minimum enforced; no upper limit |

> **Design note:** Real HYIP schemes often show a "Total Funds Under Management" figure. This is fabricated. In our game, operators may optionally display a fake AUM number of their own choosing as a purely cosmetic trust signal. It has no mechanical effect — but experienced investors will learn to ignore it.

---

## 7. Scheme Lifecycle

### 7.1 Active
The scheme is listed publicly, accepting new investments and paying out existing ones per its parameters. The operator's reserve decreases with each payout. Investors watch public signals to assess health. This phase can last anywhere from hours to months depending on the operator's choices and the inflow of new investment.

### 7.2 Collapse — Natural
If the reserve hits zero without the operator pulling the rug, the scheme auto-collapses. All remaining investors receive a recovery payout — a small random percentage of their invested amount, simulating the scraps left in a real collapse. Recovery is randomised between configurable floor and ceiling values (suggested starting range: 2%–15%). The randomness adds a final moment of tension even after collapse.

### 7.3 Collapse — Rug Pull
The operator deliberately triggers collapse at any time, immediately withdrawing the remaining reserve to their own wallet. The scheme ends instantly. Investors still receive the same small random recovery percentage — the operator does not gain the investors' principal, only whatever remained in the reserve. This is an important mechanical distinction: the operator profits most by keeping the scheme running just long enough to maximise inflow, then pulling while reserve is still healthy.

### 7.4 Post-Collapse Archive
Every collapsed scheme remains permanently visible in a searchable archive. It displays full statistics: total invested, total paid out, operator profit, number of investors caught, collapse type (natural or rug pull), and duration. This archive is one of the game's most valuable features — both as entertainment and as education. Patterns across many schemes reveal exactly how the maths works.

---

## 8. The HYIP Monitor Tab

In the real world, independent "HYIP monitor" websites track active schemes and publish payment status updates. They show whether a scheme is Paying, Waiting, or Problem, along with days online, investment plans, and community comments. Crucially, real monitors are funded by listing fees paid by the scheme operators — meaning a monitor has a financial incentive to keep a scheme listed as "Paying" for as long as possible, regardless of actual health.

In our game, the HYIP Monitor is a built-in tab within the platform. It aggregates public data across all active schemes in one place and is the primary interface for investors doing research. What it shows is entirely derived from public, verifiable signals — it never reveals the operator's reserve.

### 8.1 What the Monitor Shows (Per Scheme)

| Signal | What It Actually Tells an Investor |
|---|---|
| Status: Paying / Waiting / Problem | Derived from whether recent withdrawals completed on time. Operators can game this by approving small withdrawals quickly. |
| Days Online | Age since launch. Older = more paid out = reserve under more pressure. |
| Daily Rate & Plan Duration | The promised return. Higher daily rate = shorter probable lifespan. A 10%/day scheme cannot survive long under any circumstances. |
| Last Paid | Timestamp of most recent confirmed payout. A gap here is a red flag. |
| Withdrawal Mode | Instant vs. delayed vs. manual — delays increasingly indicate stress. |
| Referral Bonus | Presence suggests the operator is spending to attract volume. Early confidence, or late desperation. |
| Proof of Payments Feed | If enabled, shows recent payouts. Cannot be independently verified. |
| Community Comments | Investor-posted confirmations, warnings, suspicions. Operators receive anonymous comment tokens to post to their own scheme. Experienced investors learn to spot operator-posted hype. |
| Operator Reputation Score | Aggregate score based on the operator's history across all schemes. |

> **Design note:** The Monitor does NOT show the reserve, total investor count, total volume, or any operator-side financial data. This is a deliberate and authentic design choice. Real HYIP sites never show this — because doing so would immediately reveal how close to collapse they are.

### 8.2 What Investors Cannot See

The reserve is always private. Investors cannot know how much money the operator has left. They can only infer it from the speed and reliability of payouts, the age of the scheme, the interest rate's sustainability, and community comments. This information asymmetry is the core of both the game and the real scam — and learning to read indirect signals is the actual skill the game teaches.

---

## 9. Investor Experience

### 9.1 Making a Decision
An investor browses the Monitor tab, studies the available signals, and decides whether to commit coins. The tension between a high daily rate (attractive but risky) and a low daily rate (boring but sustainable) maps exactly to real HYIP investor psychology. New players will almost certainly chase the highest rates and lose. Over time, pattern recognition develops.

### 9.2 Managing a Position
After investing, the player's dashboard shows their current positions: coins invested, interest accumulated, and the withdrawal status of each scheme. They can request withdrawal at any time, subject to the scheme's withdrawal mode.

### 9.3 The Exit Decision
The game's sharpest investor moment is deciding when to exit. Too early and you leave interest on the table. Too late and you catch a collapse. A scheme that was paying instantly yesterday but now shows a 24-hour delay is sending a classic distress signal. A Waiting or Problem status means other investors are also trying to get out — the queue is forming.

---

## 10. Operator Experience

### 10.1 The Operator Dashboard
The operator sees everything investors cannot: current reserve balance, total active investors, total liability, daily payout burn rate, current inflow from new investments, and a projected days-until-bankruptcy figure. This is the only place in the game where the real financial picture is visible.

### 10.2 Reserve Management
The operator can inject additional coins from their own wallet into the reserve at any time. This resets the projected lifespan upward and can restore the "Paying" status signal on the Monitor — a classic real-world tactic for extending a scheme's life and restoring investor confidence.

### 10.3 The Rug Pull
The rug pull button is always visible on the dashboard. One press collapses the scheme immediately, transfers the remaining reserve to the operator's wallet, and triggers random recovery payouts to investors. The core operator dilemma: pull now while reserve is healthy and profits are certain, or let the scheme run longer, attract more inflow, and risk a natural collapse that wipes the reserve before you can exit.

### 10.4 Comment Tokens
Each operator receives a small number of anonymous comment tokens when they launch a scheme. These can be used to post to their own scheme's comment thread under a randomised username — replicating the well-documented real behaviour of HYIP admins seeding their own comment sections with fake payment proofs and enthusiasm. Tokens are limited and not replenishable.

---

## 11. Reputation System

Every operator accumulates a public reputation score visible on the Monitor, calculated from: number of schemes run, average lifespan before collapse, percentage of collapses that were rug pulls versus natural, and average investor recovery rate.

Reputation status labels progress through: *New → Paying → Veteran → Trusted → Suspected → Problem → Scammer.* These are earned by behaviour, not self-reported.

A high reputation score attracts more investors who invest more heavily and hold longer — creating richer opportunities in both directions. Reputation cannot be gamed by running many short schemes — the average lifespan and recovery rate components penalise serial fast-ruggers.

---

## 12. Random Events

A small set of random events fire occasionally to prevent schemes from being purely deterministic:

- **Audit Alert:** A random active scheme is flagged by a fictional in-game regulator. Triggers a panic comment wave and a rush of withdrawal requests.
- **Whale Deposit:** A large anonymous deposit hits a scheme, temporarily boosting inflow figures and attracting copycat investors.
- **Copycat Scheme:** A near-identical scheme launches, splitting investor attention and slowing inflow to the original.
- **Payout Delay Bug:** A random scheme experiences a simulated technical delay — payouts frozen for 24 hours with a visible "Waiting" status.
- **Faucet Bonus:** A random event floods the game with new faucet coins, sending a wave of new inexperienced investors into the most prominently advertised schemes.

---

## 13. Advertising & Promotion

Operators can spend coins from their reserve to promote their scheme on the Monitor listings page. Promoted schemes appear at the top with a visible badge. The spend drains the reserve faster — exactly the trade-off real operators face.

The "Promoted" label is itself a mixed signal: it shows the operator is spending actively, but experienced investors may view heavy promotion as a sign of desperation to attract new inflow rather than genuine confidence.

---

## 14. Achievements & Badges

| Badge | Awarded For |
|---|---|
| First Blood | Lose your first investment to a collapsed scheme |
| Diamond Hands | Hold in a scheme until natural collapse and still show net profit |
| Exit Scammer | Successfully rug pull your first scheme as operator |
| Veteran Investor | Survive 10 scheme collapses with a net positive lifetime balance |
| Whale Hunter | Withdraw from a scheme within 24 hours before it collapses |
| Ponzi Architect | Run a scheme that stays active for 30+ days before collapsing |
| True Believer | Re-invest in the same operator's second scheme after losing to their first |
| Last Out | Be the final investor to successfully withdraw before a natural collapse |
| Comment Section Hero | Use all your operator comment tokens within 24 hours of launch |
| Rugged Twice | Lose investments to the same operator in two separate schemes |

---

## 15. Data Model (High Level)

| Entity | Key Fields |
|---|---|
| User | user_id, balance, reputation_score, faucet_last_claimed, total_invested, total_earned, operator_stake |
| Scheme | scheme_id, operator_id, name, theme, fake_aum_display, unit_size, daily_rate, duration_days, referral_pct, withdrawal_mode, proof_of_payments_enabled, reserve, advertising_budget_spent, status, created_at, collapsed_at, collapse_type |
| Investment | investment_id, scheme_id, investor_id, units, amount_coins, invested_at, withdrawn_at, status, recovery_pct_on_collapse |
| Payout | payout_id, investment_id, amount, paid_at, payout_type (interest / principal / recovery) |
| WithdrawalRequest | request_id, investment_id, requested_at, completed_at, status (pending / paid / failed) |
| SchemeComment | comment_id, scheme_id, real_user_id, displayed_username, is_operator_token, body, posted_at |
| MonitorEvent | event_id, scheme_id, event_type, triggered_at, details_json |
| Achievement | achievement_id, user_id, badge_type, awarded_at |

---

## 16. Integration with RoflFaucet

The game launches as a mini-game within RoflFaucet.com, using existing shared infrastructure:

- Shared user accounts and authentication — no separate sign-up
- Shared Rofl Coin balance — the same currency across all RoflFaucet games
- Faucet integration — the daily faucet drip feeds new player starting balances
- Shared profile page — HYIP stats (schemes run, investor record, badges) sit alongside other game stats

If the game proves popular and warrants a standalone version with its own domain and branding, that is a natural second phase.

---

## 17. Open Questions for Discussion

1. What exact coin value should the soft minimum operator stake be set to? Suggested: 500 coins. Needs playtesting.
2. Should the random recovery percentage on collapse be purely random within the range, or weighted so earlier investors recover slightly more (more authentic)?
3. Should operators be able to see who specifically has invested in their scheme, or only aggregate totals?
4. How many anonymous comment tokens should an operator receive per scheme? Suggested: 5.
5. Should there be a cap on the number of simultaneously active schemes, or left to natural market dynamics?
6. Should the Faucet Bonus random event be telegraphed in advance or arrive without warning?
7. Is there value in a simple external sharing mechanism — e.g. a Telegram bot that operators can use to advertise their scheme link outside the platform?

---

## 18. Next Steps

1. Resolve open questions, particularly minimum stake and recovery weighting.
2. Build static mockups of the Monitor tab, scheme listing card, scheme creation form, and operator dashboard.
3. Finalise database schema and agree on tech stack.
4. Implement a single-user prototype with AI-driven dummy schemes to validate game feel before multiplayer launch.
5. Soft-launch to existing RoflFaucet community for feedback and balance tuning.

---

*End of Document — HYIP Scammer Game Design v0.2*
