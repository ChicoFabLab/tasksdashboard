# Redesign Brief — CFL Task Dashboard (2026)

This is the working prompt the redesign was built from. Use it to brief any future
contributor (human or AI) picking this work up.

---

## Role & context

You are a senior product engineer + product designer taking over the **Chico Fab Lab
task dashboard** (`tasks.chicofl.org`). The lab is a community makerspace. The app has
two jobs:

1. **Tasks** — volunteers find small jobs around the shop (clean the laser, restock
   filament, sort hardware), claim them, finish them, and get credit for their time.
2. **Creations** — anyone can show off what they made in the space.

It runs on a **large wall-mounted touchscreen** in the lab, on members' **phones**
(arriving via QR codes printed on/near the screen), and on **desktop/wide screens**.

Stack: Next.js 15 (App Router) + React 19 + Tailwind 4, PocketBase 0.26 at
`pb.chicofl.org` (systemd `pocketbase.service`, data in `/var/www/cfl-volunteer-board`).
Live app = pm2 process `cfl-dashboard` (user `cfl`, port 3001) behind a Cloudflare tunnel.

## The problem

- Usage has collapsed: ~41 task completions/month in Oct 2025 → ~1/month by Sep 2026.
- Design feels stale (purple gradients, emoji, glassmorphism); not built for touch.
- Discord is mandatory for login and its integration is unreliable (three parallel
  OAuth flows; one silently failed for new users).
- Security is effectively absent: the session is an unsigned JSON cookie anyone can
  edit; a public endpoint merges arbitrary JSON into it; the PocketBase superuser token
  is stored in a browser cookie; collection rules let anonymous users update any
  volunteer and create/delete completions and creations; admin detection is broken.

## Goals (in priority order)

1. **Make contribution visible.** Feature what people have *completed* and *made* —
   recent completions with names/faces/photos, creations front and centre, per-maker
   profile pages. Recognition is the main lever on the drop-off.
2. **Zero-friction claiming.** Every task has a QR code. Scan it → task page on your
   phone → one tap to claim, one tap (+ optional minutes/photo) to finish. If not
   signed in, sign in/up inline and land back on the same task.
3. **Accounts without Discord.** Username + password sign-up is first-class. Discord
   is optional: sign in with it, or link it later from your dashboard.
4. **Touch-first, responsive.** Kiosk (≥1920px, touch, no keyboard assumptions, ≥56px
   targets, no hover-only affordances), desktop, and phone (≥360px) all first-class.
5. **Modern, simple, representative design.** A calm, workshop-honest look: warm paper
   neutrals, ink text, one high-visibility "safety orange" accent, zone colours as small
   tags, generous whitespace, real photos doing the talking. No gradients-as-decoration,
   no emoji as UI.
6. **Secure by construction.** Signed sessions; every write goes through a server route
   that checks identity and ownership; PocketBase rules locked to public-read /
   server-write; inputs validated; uploads type/size-checked; rate-limited auth.
7. **Reversible.** Full backups first; work on a dev branch in a separate worktree;
   switching live → old and back is one command; documented in `HANDOFF.md`.

## Non-goals

- No data migrations that alter or delete existing records. Schema changes are
  additive only (new optional fields).
- The "goals/courses" feature (1 goal, 0 progress records) is not carried into the
  new UI. Its data is left untouched.

## Information architecture

| Route | Purpose |
|---|---|
| `/` | "Today at the lab": impact stats, recent completions feed, newest creations, open tasks, clear CTAs |
| `/tasks` | Task board — filter by zone/status, large cards |
| `/tasks/[n]` | Task detail by task number (QR target): claim / finish / unclaim, QR to hand off to phone |
| `/claim`, `/claim/[n]` | Legacy QR/URL entry points → redirect to the above |
| `/display` | Kiosk mode: full-screen, auto-refreshing, touch-to-open task QR sheets, rotating spotlight of completions & creations |
| `/creations`, `/creations/[id]`, `/creations/new` | Gallery, detail, share |
| `/makers/[id]` | Public maker profile: completed work + creations |
| `/me` | Personal dashboard: my active tasks, history, hours, creations, profile, password, Discord link |
| `/login`, `/signup` | Password or Discord |
| `/admin` | Tasks, members, featured creations (admins only) |

## Acceptance criteria

- New visitor on a phone can scan a task QR, create a password account, and finish the
  task in under 60 seconds without Discord.
- Kiosk shows the open tasks + recent wins legibly from 3 m and every interactive
  element is ≥56px; an idle kiosk returns to its home view.
- Forged cookies, direct PocketBase writes, and cross-user edits all fail.
- `npm run build` passes with no type errors; no runtime errors on empty data.
- An adversarial design review has been run and its high-severity findings addressed.
- `HANDOFF.md` lets someone roll back to the previous version in minutes.
