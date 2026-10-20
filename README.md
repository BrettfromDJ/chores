# PokéQuest

A mobile-first chore app where XP is real money. Kids complete real-life chores ("quests") to earn XP (**100 XP = $1**). XP goes into their wallet, and parents cash it out as real money.

Built with **Next.js 15 (App Router)**, **Tailwind CSS**, and **Supabase** (optional — runs on built-in demo data out of the box).

## Quick start

```bash
npm install
cp .env.example .env.local   # optional in dev
npm run dev
```

Open http://localhost:3000 and sign in with the pre-filled demo account:

| | |
|---|---|
| Email | `parent@pokequest.demo` |
| Password | `trainer123` |
| Parent PIN | `1234` |

Demo data lives in `.data/pokequest.json`; delete that file (or use **Parent → Settings → Reset demo**) to start over.

## What's inside

**Kid experience** (`/kid/[id]`): game-style dashboard with a partner creature, level meter, streak, and daily and weekly quests that each show their pay (e.g. +50 XP · $0.50). The **Wallet** tab shows the XP balance, its dollar value, and full history. The **Journal** tab has badges and an adventure log.

**Parent dashboard** (`/parent`): PIN-locked, minimal admin with an approval queue (approve, send back with a note, approve all), a **Money** page (cash out, add bonuses, all wallet activity), quests with XP pay, kid profiles, history, and settings.

### How the money works

1. A kid taps **Done!** → a *pending* completion is stored. Nothing is paid.
2. A parent approves on the server → the quest's XP is written to the kid's wallet ledger.
3. **100 XP = $1.** Every amount is stored as integer XP (1 XP = 1 cent), so there are no rounding issues.
4. **Every level-up pays a $1 bonus** (100 XP), added automatically on the server, and the kid sees a "Level Up!" celebration. Levels count quest XP and parent bonuses, not the level-up bonus itself, so bonuses can't cascade.
5. When a parent hands over real money, they record a **Cash out**, which can never exceed the balance. **Bonuses** (birthday money, etc.) add to the wallet.

Levels and money badges are based on lifetime XP earned. The wallet balance is the sum of the ledger.

## Security model

- **Family session:** a parent signs in once per device (demo: HMAC-signed httpOnly cookie, Supabase: Supabase Auth).
- **Parent PIN:** admin pages and every XP-changing server action require a short-lived (20 min), signed `pq_parent` cookie that you get by entering the PIN. PINs and passwords are hashed with scrypt, and PIN attempts are throttled.
- **Server-side money only:** quest pay is read from the server-side chore, never from the client. In Supabase mode, Row Level Security scopes every table to the parent's family. The `transactions` ledger has no client write policy. Approvals, cash-outs and bonuses go through `SECURITY DEFINER` functions (`review_completion`, `add_transaction`) that lock the child row and check the balance.

Set `AUTH_SECRET` (16+ random characters) in production. The app refuses to start sessions without it.

## Connecting Supabase

1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`). The legacy name `NEXT_PUBLIC_SUPABASE_ANON_KEY` also works.
3. Restart. The app switches to Supabase automatically, and parents can create accounts from the sign-in screen. The first visit to the parent area asks them to set a PIN.

Both backends implement the same `Repo` interface (`src/lib/data/repo.ts`).

## Project layout

```
src/app/                 routes (kid, parent, login) + server actions
src/components/          Mascot (original SVG creatures), game UI kit, kid/parent components
src/lib/game.ts          levels, periods (daily/weekly reset in APP_TIMEZONE), streaks, badges
src/lib/money.ts         XP ↔ dollars (100 XP = $1), formatting; currency via NEXT_PUBLIC_CURRENCY
src/lib/data/            demo (JSON file) and Supabase repositories
src/lib/auth/            sessions, parent PIN unlock, password hashing
supabase/schema.sql      tables, RLS policies, wallet functions
```

All creatures and UI are original. No official Pokémon artwork or logos are used.
