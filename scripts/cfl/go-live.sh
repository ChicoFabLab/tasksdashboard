#!/bin/bash
# Switch tasks.chicofl.org to the redesign. Run as root on the CFL server.
#   sudo bash scripts/cfl/go-live.sh
# Safe to re-run. Rollback: sudo bash scripts/cfl/rollback.sh
set -euo pipefail

NEW=/var/www/taskdashboard/tasksdashboard-redesign
OLD=/var/www/taskdashboard/tasksdashboard
PB_LOCAL=http://127.0.0.1:8091
STAMP=$(date +%Y%m%d-%H%M%S)
BK=/var/backups/taskdashboard/golive-$STAMP
mkdir -p "$BK"

grep -q "^SESSION_SECRET=" "$NEW/.env.local" || { echo "Missing $NEW/.env.local with SESSION_SECRET (see HANDOFF.md)"; exit 1; }

echo "== 1. Back up PocketBase data (consistent sqlite snapshot) -> $BK"
sqlite3 /var/www/cfl-volunteer-board/pb_data/data.db ".backup '$BK/data.db'"
sudo -u cfl pm2 jlist > "$BK/pm2-cfl.json"

echo "== 2. Apply PocketBase migration (snapshot saved for rollback)"
set -a; . "$OLD/.env.local"; set +a
cd "$BK"
PB_URL=$PB_LOCAL PB_EMAIL="$POCKETBASE_ADMIN_EMAIL" PB_PASSWORD="$POCKETBASE_ADMIN_PASSWORD" \
  node "$NEW/scripts/pb-migrate-2026.mjs"
# Keep the FIRST snapshot as the rollback target (later ones already contain the locked rules).
[ -e /var/backups/taskdashboard/LATEST-pb-snapshot.json ] || ln -s "$BK"/pb-snapshot-*.json /var/backups/taskdashboard/LATEST-pb-snapshot.json

echo "== 3. Build the new app as user cfl"
chown -R cfl:cfl "$NEW"
cd "$NEW"
sudo -u cfl npm ci --no-audit --no-fund
sudo -u cfl npx next build

echo "== 4. Point pm2 'cfl-dashboard' (port 3001) at the new build"
sudo -u cfl pm2 delete cfl-dashboard || true
sudo -u cfl pm2 start "$NEW/node_modules/next/dist/bin/next" --name cfl-dashboard --cwd "$NEW" -- start -p 3001
sudo -u cfl pm2 save
sleep 5
curl -fsS http://127.0.0.1:3001/api/health && echo " <- new app healthy"
echo "Live. Backup + PocketBase snapshot in $BK"
