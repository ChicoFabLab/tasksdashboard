#!/bin/bash
# Ship a code update of the redesign (no database changes). Run as root.
#   sudo bash scripts/cfl/redeploy.sh
# Builds beside the live build, swaps it in, keeps the previous build in .next-prev.
# Undo the last redeploy:  sudo bash scripts/cfl/redeploy.sh --revert
set -euo pipefail
NEW=/var/www/taskdashboard/tasksdashboard-redesign
cd "$NEW"

if [ "${1:-}" = "--revert" ]; then
  [ -d .next-prev ] || { echo "No previous build to revert to"; exit 1; }
  mv .next .next-failed && mv .next-prev .next && rm -rf .next-failed
  sudo -u cfl pm2 restart cfl-dashboard
  echo "Reverted to previous build."; exit 0
fi

chown -R cfl:cfl "$NEW"
sudo -u cfl npm ci --no-audit --no-fund
sudo -u cfl env NEXT_DIST_DIR=.next-build npx next build
rm -rf .next-prev
mv .next .next-prev
mv .next-build .next
sudo -u cfl pm2 restart cfl-dashboard
sleep 5
curl -fsS http://127.0.0.1:3001/api/health && echo " <- redeployed"
