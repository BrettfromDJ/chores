# PokéQuest

A mobile-first chore reward app. Kids complete real-life chores ("quests") to earn XP, level up, and unlock physical trading-card rewards picked by their parents.

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

Mia's first reward is already unlocked, so opening her dashboard plays the reward-reveal animation. Demo data lives in `.data/pokequest.json`; delete that file (or use **Parent → Settings → Reset demo**) to start over.

## What's inside

**Kid experience** (`/kid/[id]`): game-style dashboard with a partner creature, level meter, XP balance, streak, daily and weekly quests, reward goal progress, a trophy case, badges, an adventure log, and an animated "Quest Egg" reward reveal.

**Parent dashboard** (`/parent`): PIN-locked, minimal admin with an approval queue (approve, send back with a note, approve all), quests, rewards with images and goal order, kid profiles, full history, and settings.

### How XP works

1. A kid taps **Done!** → a *pending* completion is stored. No XP is granted.
2. A parent approves on the server → an XP ledger entry is written.
3. In the same server step, the kid's next reward goal unlocks automatically once their balance covers it, and its XP cost is deducted.
4. The kid sees the reveal animation the next time they open their dashboard. The parent marks the physical card **handed over**.

Level is based on lifetime XP, and rewards are paid from the spendable balance.

## Security model

- **Family session:** a parent signs in once per device (demo: HMAC-signed httpOnly cookie, Supabase: Supabase Auth).
- **Parent PIN:** admin pages and every XP-changing server action require a short-lived (20 min), signed `pq_parent` cookie that you get by entering the PIN. PINs and passwords are hashed with scrypt, and PIN attempts are throttled.
- **Server-side awards only:** XP values are read from the server-side chore, never from the client. In Supabase mode, Row Level Security scopes every table to the parent's family. `xp_events` has no client write policy, and status changes go through `SECURITY DEFINER` functions (`review_completion`, `settle_rewards`).

Set `AUTH_SECRET` (16+ random characters) in production. The app refuses to start sessions without it.

## Connecting Supabase

1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`).
3. Restart. The app switches to Supabase automatically, and parents can create accounts from the sign-in screen. The first visit to the parent area asks them to set a PIN.

Both backends implement the same `Repo` interface (`src/lib/data/repo.ts`).

## Project layout

```
src/app/                 routes (kid, parent, login) + server actions
src/components/          Mascot (original SVG creatures), CardArt, game UI kit, kid/parent components
src/lib/game.ts          levels, periods (daily/weekly reset in APP_TIMEZONE), streaks, badges
src/lib/data/            demo (JSON file) and Supabase repositories
src/lib/auth/            sessions, parent PIN unlock, password hashing
supabase/schema.sql      tables, RLS policies, XP functions
```

All creatures, card art and UI are original. No official Pokémon artwork or logos are used.
