# CFL Task Dashboard

Volunteer task management system for Chico Fab Lab. Real-time task board with Discord auth, volunteer tracking, and public TV display.

## KIOSK Information
[https://chicofl.org/wiki/cfl-kiosk](https://chicofl.org/wiki/cfl-kiosk)

## Features

- Real-time task board with PocketBase subscriptions
- Discord OAuth authentication
- Public TV display mode (kiosk)
- Volunteer hours and completion tracking
- Community project showcase
- Learning goals and certifications
- QR code task completion

## Tech Stack

- Next.js 15.5.7, React 19, Tailwind CSS 4
- PocketBase (SQLite + REST API)
- Discord OAuth (NextAuth)
- Real-time updates via WebSocket

## Quick Start

### 1. Install

```bash
npm install
```

### 2. PocketBase Setup

Download from https://pocketbase.io/docs/ and place binary in this directory.

```bash
chmod +x pocketbase
./pocketbase serve --http=127.0.0.1:8090
```

Create collections using `pb_schema.json` (import via Admin UI at http://127.0.0.1:8090/_/)

### 3. Environment Variables

Create `.env.local`:

```env
# PocketBase
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=yourpassword

# Discord OAuth (https://discord.com/developers/applications)
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_secret
DISCORD_GUILD_ID=your_server_id

# Discord Bot
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_ANNOUNCEMENTS_CHANNEL_ID=your_channel_id

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=random_string_here

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional: Invite code for registration (leave empty to disable)
# NEXT_PUBLIC_INVITE_CODE=your_invite_code
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000

## Key Routes

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Home page | No |
| `/display` | TV kiosk display | No |
| `/volunteer/tasks` | Task dashboard | Yes |
| `/task/create` | Create task | Yes |
| `/claim` | Quick complete (QR) | No |
| `/creations` | Project gallery | No |
| `/admin` | Admin panel | Yes |

## Database

**Collections:** (see `pb_schema.json`)
- `volunteers` - User accounts
- `tasks` - Task management
- `completions` - Completion tracking
- `creations` - Project showcase
- `goals` - Learning paths
- `goal_progress` - User progress

## Discord Setup

1. Create app at https://discord.com/developers/applications
2. OAuth2 redirect: `http://localhost:3000/api/auth/discord/callback`
3. Create bot, invite to server
4. Bot permissions: Send Messages, Read Messages

## Production

```bash
npm run build
npm start
```

Update `.env.local` with production URLs.

## File Structure

```
├── src/
│   ├── app/           # Pages & API routes
│   ├── components/    # React components
│   └── lib/           # Utilities & PocketBase
├── public/            # Static assets & PDFs
├── pb_schema.json     # Database schema
└── README.md          # This file
```

## Troubleshooting

**PocketBase not connecting:**
```bash
curl http://localhost:8090/api/health
```

**Discord auth fails:**
- Check redirect URI matches exactly
- Verify client ID/secret in `.env.local`
- Clear browser cookies

**Real-time updates not working:**
- Check WebSocket connection in browser DevTools
- Verify PocketBase is running
- Check firewall settings

## License

MIT


## TODO

- Improve docker file to have dev and production
-- Research different build targets
-- Create a built image that's compatible with ghcr.
- Test docker on server with env file supplied (volume mount)
- Set up github actions so that docker image is built and can run from github
