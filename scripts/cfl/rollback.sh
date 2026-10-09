#!/bin/bash
# Put tasks.chicofl.org back on the previous version (pre-redesign).
#   sudo bash scripts/cfl/rollback.sh [path/to/pb-snapshot.json]
# 1) restores PocketBase API rules the old app needs, 2) restarts the old build.
# Data created on the new version (tasks, completions, creations, accounts) is kept.
set -euo pipefail

OLD=/var/www/taskdashboard/tasksdashboard
NEW=/var/www/taskdashboard/tasksdashboard-redesign
SNAP=${1:-/var/backups/taskdashboard/LATEST-pb-snapshot.json}

echo "== 1. Restore PocketBase rules from $SNAP"
set -a; . "$OLD/.env.local"; set +a
PB_URL=http://127.0.0.1:8091 PB_EMAIL="$POCKETBASE_ADMIN_EMAIL" PB_PASSWORD="$POCKETBASE_ADMIN_PASSWORD" \
  node "$NEW/scripts/pb-rollback-2026.mjs" "$(readlink -f "$SNAP")"

echo "== 2. Restart the old app on port 3001"
sudo -u cfl pm2 delete cfl-dashboard || true
sudo -u cfl pm2 start "$OLD/node_modules/next/dist/bin/next" --name cfl-dashboard --cwd "$OLD" -- start -p 3001
sudo -u cfl pm2 save
sleep 5
curl -fsS -o /dev/null -w "old app HTTP %{http_code}\n" http://127.0.0.1:3001/
echo "Rolled back. Note: accounts created with a password on the new version can't log in on the old one (it only supports Discord)."
