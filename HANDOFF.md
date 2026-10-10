# Handoff — 2026 Redesign (branch `dev/redesign-2026`)

**Went live:** 2026-10-09 19:07 UTC. Go-live backup: `/var/backups/taskdashboard/golive-20261009-190719/`.

**TL;DR** — tasks.chicofl.org runs the redesign from
`/var/www/taskdashboard/tasksdashboard-redesign`. The previous version is untouched in
`/var/www/taskdashboard/tasksdashboard`. To go back:

```bash
sudo bash /var/www/taskdashboard/tasksdashboard-redesign/scripts/cfl/rollback.sh
```

That restores the old database rules and restarts the old build on the same port. It takes about 10 seconds.

---

## 1. What's where

| Thing | Location |
|---|---|
| New app (live) | `/var/www/taskdashboard/tasksdashboard-redesign` (git worktree, branch `dev/redesign-2026`) |
| Old app (kept, built, ready) | `/var/www/taskdashboard/tasksdashboard` (branch `mobiledesign`, commit `7e1ce33`) |
| Git tag of the old version | `pre-redesign-2026-10-09` (pushed to GitHub) |
| Process | pm2 app `cfl-dashboard`, user `cfl`, port 3001: `sudo -u cfl pm2 ls` / `sudo -u cfl pm2 logs cfl-dashboard` |
| Database | PocketBase 0.26.2, systemd `pocketbase.service`, `127.0.0.1:8091` → `pb.chicofl.org`, data in `/var/www/cfl-volunteer-board/pb_data` |
| Public URL | Cloudflare tunnel → `localhost:3001` (unchanged) |
| Env file | `tasksdashboard-redesign/.env.local` (gitignored; based on the old one, see §5) |
| Kiosk URL | `https://tasks.chicofl.org/display` |

## 2. Backups (taken before any change)

`/var/backups/taskdashboard/2026-10-09-pre-redesign/`

| File | What |
|---|---|
| `app-full.tar.gz` | The whole old app dir incl. `.env.local` and the built `.next/` (no node_modules) |
| `data.db`, `auxiliary.db` | Consistent SQLite snapshots of PocketBase (`sqlite3 .backup`) |
| `pb_storage.tar.gz` | All uploaded files (photos) |
| `pb_migrations.tar.gz` | PocketBase migration history |
| `pm2-cfl.json`, `pocketbase.service` | Process config as it was |
| `SHA256SUMS` | Checksums |

The go-live script takes a second DB snapshot and a JSON snapshot of the collection
rules at the moment of switching: `/var/backups/taskdashboard/golive-<timestamp>/`.
`/var/backups/taskdashboard/LATEST-pb-snapshot.json` points to the latest rules snapshot.

## 3. Rolling back

### a) Quick rollback (keeps all data)
```bash
sudo bash /var/www/taskdashboard/tasksdashboard-redesign/scripts/cfl/rollback.sh
```
- Restores the PocketBase API rules and auth settings the old app needs (the old app writes to the DB from the browser).
- Restarts pm2 `cfl-dashboard` from the old directory.
- Tasks, completions, creations and accounts created on the new version stay in the DB, and the old app shows them.
- New fields (`is_admin`, `pw_hash`, `completions.photo`, `creations.featured`) are left in place. The old app ignores them.
- Caveat: people who signed up with a **password only** can't log in to the old app, which is Discord-only.

### b) Manual rollback (if the script can't run)
```bash
sudo -u cfl pm2 delete cfl-dashboard
sudo -u cfl pm2 start /var/www/taskdashboard/tasksdashboard/node_modules/next/dist/bin/next \
  --name cfl-dashboard --cwd /var/www/taskdashboard/tasksdashboard -- start -p 3001
sudo -u cfl pm2 save
# then restore DB rules:
cd /var/www/taskdashboard/tasksdashboard-redesign && set -a && . ../tasksdashboard/.env.local && set +a
PB_URL=http://127.0.0.1:8091 PB_EMAIL=$POCKETBASE_ADMIN_EMAIL PB_PASSWORD=$POCKETBASE_ADMIN_PASSWORD \
  node scripts/pb-rollback-2026.mjs /var/backups/taskdashboard/LATEST-pb-snapshot.json
```

### c) Full restore of the database to the morning of 2026-10-09 (last resort; loses newer data)
```bash
sudo systemctl stop pocketbase
cd /var/www/cfl-volunteer-board/pb_data
mkdir -p /var/backups/taskdashboard/displaced-$(date +%s) && mv data.db* auxiliary.db* storage /var/backups/taskdashboard/displaced-*/
cp /var/backups/taskdashboard/2026-10-09-pre-redesign/{data.db,auxiliary.db} .
tar -xzf /var/backups/taskdashboard/2026-10-09-pre-redesign/pb_storage.tar.gz -C .
chown -R erinb:erinb /var/www/cfl-volunteer-board/pb_data
sudo systemctl start pocketbase
```

### d) Code
The old code is tag `pre-redesign-2026-10-09` (= `mobiledesign` @ `7e1ce33`). `main` was never touched.
If the redesign is merged and later regretted: `git revert -m 1 <merge commit>`.

## 4. Shipping updates
Code-only changes (most updates):
```bash
cd /var/www/taskdashboard/tasksdashboard-redesign && sudo -u cfl git pull
sudo bash scripts/cfl/redeploy.sh            # builds beside the live build, swaps it in
sudo bash scripts/cfl/redeploy.sh --revert   # undo the last redeploy (previous build kept in .next-prev)
```
`go-live.sh` is only for the original switch-over or new database migrations. It keeps the
first rules snapshot as the rollback target, so it is safe to re-run.

## 5. Configuration (`.env.local` of the new app)
These were added to the old file's values:

| Var | Purpose |
|---|---|
| `SESSION_SECRET` | Signs login cookies. Rotating it signs everyone out. |
| `POCKETBASE_INTERNAL_URL=http://127.0.0.1:8091` | The server talks to PB locally rather than through the tunnel |
| `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_SHORT_NAME` | Branding (needs a rebuild after changing) |
| `ADMIN_EMAILS` | Comma-separated admin accounts (currently Gavin and Erin). Admins can also grant admin from `/admin → Members`. |
| `DISCORD_ADMIN_ROLES` | Discord roles that grant admin at Discord sign-in (default `Zone Leader`) |
| `SIGNUP_INVITE_CODE` | Optional. If set, password sign-up requires it (checked on the server) |

`NEXT_PUBLIC_INVITE_CODE` and `NEXTAUTH_URL` are no longer used.

## 6. What changed and why
See `REDESIGN_BRIEF.md` for the full brief. Summary:

**Security (all critical issues from the audit fixed)**
- Sessions are an HMAC-signed cookie (`cfl_session`). The old unsigned `volunteer_session` cookie and the `pb_auth` cookie, which held a **PocketBase superuser token**, are ignored and cleared.
- The browser never writes to PocketBase. All writes go through server actions that check who you are and whether you own the thing (CSRF-protected by Next's origin check).
- PocketBase rules are locked: tasks, completions and creations are public-read and server-write; volunteers are private; emails are hidden; PocketBase's own password login for volunteers is disabled. Passwords are verified by the app (scrypt, rate-limited).
- Inputs are validated (lengths, zones, minutes 1–1440), uploads are limited to JPG/PNG/WebP/GIF ≤10 MB, filters are parameterised, redirects are restricted to the same site, and there are basic security headers.
- Discord OAuth is one flow with a `state` check. Notifications are sent by the server only after real actions, mentions are disabled, and failures never block the user.
- Removed `next-auth` and the unused `@supabase/supabase-js`, and ran `npm audit fix`. What remains is a postcss advisory bundled inside Next at build time.

**Product**
- Password accounts. Discord is optional and can be linked or unlinked in Settings.
- QR flow: every task page is the QR target. Scan → (sign up inline) → Claim → "I finished it" (time chips, credit helpers, optional photo). Old printed `/claim/<n>` codes still work; duplicate task numbers get a picker.
- Completed work is featured on the home page ("Wins around the shop"), on maker profiles, and in the kiosk spotlight. Completion photos are new.
- Creations: multi-photo upload (photos are shrunk on the phone before upload), gallery, detail page, edit and delete, admin "feature" toggle.
- `/me` dashboard, `/makers/<id>` public profiles, and `/admin` (tasks, activity, members, temporary passwords).
- `/display` kiosk: touch-first, dark, auto-refreshes every 30 s, tap a task for a big QR, rotating spotlight, resets after 90 s idle.
- The goals/courses UI was dropped (1 goal, 0 progress records). Its data is untouched.

## 7. Needs a human
1. **Discord app switched to `1431448844285247649`** (2026-10-10). Its OAuth credentials and bot token ("cfl-dashboard") are in `.env.local`, and the previous values are backed up in `/var/backups/taskdashboard/env.local.before-*`. Still to do:
   - **Invite the bot to the lab's server.** It's in no servers yet, so announcements and the Zone Leader → admin check are off until then. Invite link (View Channels, Send Messages, Embed Links): `https://discord.com/oauth2/authorize?client_id=1431448844285247649&scope=bot&permissions=19456`. Make sure it can post in the announcements channel.
   - **Register the redirect URI.** Make sure `https://tasks.chicofl.org/api/auth/discord/callback` is listed under the app's OAuth2 → Redirects.
2. **Rotate the PocketBase superuser password.** The old app put superuser tokens in browser cookies. Those tokens expire after 24 h and the token secret was rotated at go-live, but the password should change too. Change it in the PB admin UI, then update `POCKETBASE_ADMIN_PASSWORD` in both `.env.local` files.
3. **5 members have neither Discord nor a password** (they were created by older flows). An admin can give them a temporary password: `/admin → Members → Temp password`.
4. **Point the kiosk browser at `https://tasks.chicofl.org/display`** in full-screen/kiosk mode.
5. **Duplicate task numbers** (#1, #31, #38, #65×3, #70) exist in the old data. New tasks always get a fresh number.

## 8. Testing notes
- An end-to-end suite (Playwright, 26 checks) was run against a **copy** of the DB on a private port. It covered sign-up from a scanned task, claim, finish with helper and photo, creation upload, password change and re-login, forged/legacy cookies, open redirects, cross-user edits, admin gating, and kiosk tap-to-QR. All 26 passed on the final design.
- Verified after go-live on the public URLs: anonymous PocketBase writes and password auth return 403, the volunteer list is private, tasks are publicly readable, and old `/claim/<n>` QR links resolve.
- `pm2 logs cfl-dashboard` may show `Failed to find Server Action "x"`. Those are internet scanners probing Next.js sites and are harmless.

## 9. Discord bot
- **Bot:** application `cfl-dashboard` (`1431448844285247649`). Its token is `DISCORD_BOT_TOKEN` and its public key is `DISCORD_PUBLIC_KEY`, both in `.env.local`.
- **Posts:** only two kinds, one line each, in `#general-chico-fab-lab` (`DISCORD_ANNOUNCEMENTS_CHANNEL_ID`):
  - someone posted a task
  - someone shared a creation
- **Slash command `/task`:** Discord delivers it as signed HTTP requests to `https://tasks.chicofl.org/api/discord/interactions`. No separate bot process runs. Every reply is visible only to the person who ran it.
  - `/task create title zone [minutes] [details]` — posts a task; this also triggers the #general one-liner.
  - `/task list` — your claimed tasks plus the 10 newest open ones.
  - `/task search [keyword] [zone] [user] [max_minutes] [include_done]` — find tasks by words in the title or details, by area, by person (tasks they're on, posted or finished), or ones that fit in a given time. Shows up to 15.
  - `/task claim task` and `/task close task [minutes] [note]` — the task picker autocompletes and lists your tasks first. `close` logs time to you.
  - Someone without a website account gets one automatically on first use, linked to their Discord ID.
- **Re-register after changing commands, or after moving to a different bot:**
  `cd tasksdashboard-redesign && set -a && . ./.env.local && set +a && node scripts/discord-register-commands.mjs --endpoint`
  When switching bots, update `DISCORD_BOT_TOKEN` and `DISCORD_PUBLIC_KEY` and redeploy *before* running the script.
- **Turning it off:** clear the Interactions Endpoint URL in the Discord developer portal. For posts, blank out `DISCORD_ANNOUNCEMENTS_CHANNEL_ID` and redeploy.

## 10. Time logging (from user feedback, 2026-10-10)
- **Timer.** The task page has start, pause and reset, with progress against the estimate. It is stored per device (localStorage), so a reload keeps it. "Use timer" fills the minutes.
- **Finish or leave it open.**
  - *Finished it* — marks the task done.
  - *Did some — leave it open* — saves the time as a partial entry (`completions.partial = true`), takes you off the task, and puts it back on the board with your note.
  - Partial time counts toward hours, but not toward "tasks done" or the Done column.
- **Split.** Each helper has their own minutes. The buttons are "Everyone N min" and "Split total evenly".
- **Edit.** Anyone can change the minutes and note on their own entries from the task page; admins can change anyone's. `total_minutes` is kept in step.
- **Change the estimate.** "Change" next to "About N" on a task page offers quick chips or a custom number. It's available to whoever is on the task, its poster, and admins. Leaving a task open can also set "How much is left?".
- **Board filters.** Keyword search, person, "I have 15m/30m/1h/2h", sort (newest, quickest, zone). On phones, everything except search sits behind a **Filters** button that shows how many filters are active. All filters live in the URL, so a filtered view can be shared. The wall screen has "Any / ≤30m / ≤1h" buttons.
- **Schema.** `completions.partial` (bool) was added to the live DB on 2026-10-10, additive only. Backup: `/var/backups/taskdashboard/partial-field-*`.
- **Data note.** 120 of 168 tasks predate the `created` timestamp, so the board orders by task number, and missing dates are hidden rather than showing "Invalid Date".
