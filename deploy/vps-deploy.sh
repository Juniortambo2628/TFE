#!/usr/bin/env bash
# ==============================================================================
# TFE — activate an uploaded release on the VPS. Runs as `dev`, called by
# .github/workflows/deploy.yml after rsync:
#
#   bash $APP_ROOT/releases/<release>/deploy/vps-deploy.sh <release>
#
# Layout (see docs/deploy/vps.md):
#   $APP_ROOT/releases/<release>/   one per deploy
#   $APP_ROOT/shared/.env           persistent
#   $APP_ROOT/shared/storage/       persistent (uploads, logs, sessions, cache)
#   $APP_ROOT/current -> releases/<release>
#   public_html -> private/tfe/current/public   (one-time, done by root)
#
# If anything fails before the switch, `current` is untouched and the live
# site keeps serving the previous release.
# ==============================================================================
set -euo pipefail

RELEASE="${1:?usage: vps-deploy.sh <release-name>}"
APP_ROOT="${APP_ROOT:-/home/dev/web/tfe.okjtech.co.ke/private/tfe}"
PHP_BIN="${PHP_BIN:-php}"
FPM_SERVICE="${FPM_SERVICE:-php8.3-fpm}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

REL="$APP_ROOT/releases/$RELEASE"
SHARED="$APP_ROOT/shared"

log() { printf '\n─── %s ───\n' "$*"; }
die() { printf '!!! %s\n' "$*" >&2; exit 1; }

[[ -d "$REL" ]] || die "release $REL not found"
mkdir -p "$APP_ROOT/releases" "$SHARED"
[[ -f "$SHARED/.env" ]] || die "$SHARED/.env is missing — add the PROD_ENV GitHub secret, or create it by hand (docs/deploy/vps.md, step 2)"

log "Linking shared .env and storage"
mkdir -p "$SHARED/storage/app/public" \
         "$SHARED/storage/framework/cache/data" \
         "$SHARED/storage/framework/sessions" \
         "$SHARED/storage/framework/views" \
         "$SHARED/storage/logs"
rm -rf "$REL/storage"
ln -sfn "$SHARED/storage" "$REL/storage"
ln -sfn "$SHARED/.env" "$REL/.env"
# What `artisan storage:link` would create, but pointing at the shared dir so
# it survives releases. Done with ln so it never depends on exec().
rm -rf "$REL/public/storage"
ln -sfn "$SHARED/storage/app/public" "$REL/public/storage"
mkdir -p "$REL/bootstrap/cache"

log "Permissions"
# PHP-FPM runs as dev; nginx/Apache (www-data) only need to read public files.
chmod 755 "$APP_ROOT" "$APP_ROOT/releases" "$REL"
find "$REL" -path "$REL/storage" -prune -o -type d -exec chmod 755 {} +
find "$REL" -path "$REL/storage" -prune -o -type f -exec chmod 644 {} +
chmod 755 "$REL/artisan"
chmod 711 "$SHARED"
chmod 600 "$SHARED/.env"
find "$SHARED/storage" -type d -exec chmod 755 {} +
# Uploaded images are served straight by nginx, so they must be world-readable.
find "$SHARED/storage/app/public" -type f -exec chmod 644 {} +

cd "$REL"

log "Clearing application cache"
"$PHP_BIN" artisan cache:clear || true

log "Migrating"
"$PHP_BIN" artisan migrate --force

log "Seeding (idempotent; non-fatal)"
if ! "$PHP_BIN" artisan db:seed --force; then
  echo "!!! SEEDING FAILED — deploy continues; run 'php artisan db:seed --force' in $APP_ROOT/current and read the error."
fi

"$PHP_BIN" artisan tfe:fix-asset-paths || true

log "Building caches"
"$PHP_BIN" artisan config:cache
"$PHP_BIN" artisan route:cache
"$PHP_BIN" artisan view:cache
"$PHP_BIN" artisan event:cache

log "Switching current -> $RELEASE"
ln -sfn "$REL" "$APP_ROOT/current.new"
mv -Tf "$APP_ROOT/current.new" "$APP_ROOT/current"

# OPcache + the realpath cache would keep serving the old release for up to
# ~2 minutes after the symlink moves. A reload is graceful (in-flight
# requests finish). Needs /etc/sudoers.d/tfe-deploy.
if sudo -n /usr/bin/systemctl reload "$FPM_SERVICE"; then
  echo "Reloaded $FPM_SERVICE"
else
  echo "!!! Could not reload $FPM_SERVICE — the old release may be served for ~2 minutes."
fi

"$PHP_BIN" "$APP_ROOT/current/artisan" queue:restart

# Background processes under PM2 (as dev — no root, no Hestia cron). Both are
# recreated pointing at THIS release's artisan, so neither keeps running old
# code: schedule:work spawns schedule:run from its own base path.
if command -v pm2 >/dev/null 2>&1; then
  log "PM2: queue worker + scheduler"
  pm2 delete tfe-queue tfe-scheduler >/dev/null 2>&1 || true
  # Hestia's CLI php.ini disables pcntl_* (and proc_open), which queue:work
  # needs for signals and schedule:work needs to spawn schedule:run. Clear
  # disable_functions for these two trusted processes only; the web pool's
  # settings are untouched.
  pm2 start "$PHP_BIN" --name tfe-queue --interpreter none --cwd "$REL" \
    --kill-timeout 60000 -- -d disable_functions= "$REL/artisan" queue:work --sleep=3 --tries=3 --max-time=3600
  pm2 start "$PHP_BIN" --name tfe-scheduler --interpreter none --cwd "$REL" \
    -- -d disable_functions= "$REL/artisan" schedule:work
  pm2 save
else
  echo "!!! pm2 not on PATH — queue worker and scheduler NOT started."
fi

log "Pruning old releases (keeping $KEEP_RELEASES)"
LIVE="$(readlink -f "$APP_ROOT/current")"
ls -1d "$APP_ROOT"/releases/*/ 2>/dev/null | sed 's:/$::' | sort -r | tail -n +"$((KEEP_RELEASES + 1))" |
  while read -r old; do
    [[ "$old" == "$LIVE" ]] && continue
    echo "removing $old"
    rm -rf "$old"
  done

log "Release $RELEASE is live"
