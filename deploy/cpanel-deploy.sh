#!/usr/bin/env bash
# ==============================================================================
# TFE — cPanel shared-hosting deploy script.
#
# Run this once after a fresh clone / release upload from the cPanel Terminal
# or via cPanel's "Setup Node.js/PHP App" post-deploy hook. It's idempotent —
# subsequent runs skip work that's already done.
#
#   cd $HOME/tfe          # your app root
#   bash deploy/cpanel-deploy.sh
#
# It assumes:
#   - `php` on PATH is your production PHP (8.3+); if not, set PHP_BIN below.
#   - composer is available (cPanel usually ships one at /usr/local/bin/composer;
#     if not, download the phar into $HOME/bin).
#   - The .env file is in place with the values you pasted from
#     scratchpad/production.env.
# ==============================================================================

set -euo pipefail

PHP_BIN="${PHP_BIN:-php}"
COMPOSER_BIN="${COMPOSER_BIN:-composer}"

log() { printf "\033[36m▸ %s\033[0m\n" "$*"; }
ok()  { printf "\033[32m✓ %s\033[0m\n" "$*"; }
warn(){ printf "\033[33m! %s\033[0m\n" "$*"; }

APP_ROOT="$(pwd)"
log "Deploying TFE from $APP_ROOT"

# ── 1. Sanity: .env present ───────────────────────────────────────────────────
if [[ ! -f .env ]]; then
    warn ".env not found in $APP_ROOT"
    warn "  Paste scratchpad/production.env into $APP_ROOT/.env and re-run."
    exit 1
fi
ok ".env present"

# ── 2. Dependencies ───────────────────────────────────────────────────────────
if [[ ! -d vendor ]] || [[ .env -nt vendor/autoload.php ]]; then
    log "Installing composer dependencies (production, no-dev)…"
    $COMPOSER_BIN install --no-dev --optimize-autoloader --no-interaction --prefer-dist
    ok "composer install done"
else
    ok "vendor/ already in place"
fi

# ── 3. Symlink public/storage → storage/app/public ────────────────────────────
# Required for FILESYSTEM_DISK=public. cPanel disables PHP's exec() in
# disable_functions, so `php artisan storage:link` errors with "Call to
# undefined function Illuminate\Filesystem\exec()". `ln -s` sidesteps
# exec() entirely. Idempotent: skip if the symlink is already correct.
log "Ensuring public/storage symlink…"
if [[ -L public/storage ]]; then
    ok "public/storage symlink already exists"
elif [[ -e public/storage ]]; then
    warn "public/storage exists but is not a symlink — leaving alone"
else
    ln -s "$APP_ROOT/storage/app/public" "$APP_ROOT/public/storage"
    ok "created public/storage -> storage/app/public"
fi

# ── 4. Migrations ─────────────────────────────────────────────────────────────
log "Running migrations…"
$PHP_BIN artisan migrate --force
ok "migrations done"

# ── 5. Cache config + routes + views for prod ─────────────────────────────────
log "Caching config, routes, views, events…"
$PHP_BIN artisan config:cache
$PHP_BIN artisan route:cache
$PHP_BIN artisan view:cache
$PHP_BIN artisan event:cache
ok "caches primed"

# ── 6. Restart queue workers so they pick up new code ─────────────────────────
# The cPanel cron worker respawns every minute; queue:restart signals any
# currently-running worker to exit at its next iteration.
log "Signalling queue workers to restart…"
$PHP_BIN artisan queue:restart
ok "queue:restart signalled"

# ── 7. Frontend assets ────────────────────────────────────────────────────────
# On cPanel you usually build the assets locally and commit public/build,
# rather than running vite on the server. If public/build is missing here,
# it's a sign the build wasn't uploaded.
if [[ ! -d public/build ]]; then
    warn "public/build/ is missing — the frontend bundle wasn't uploaded."
    warn "  Run \`npx vite build\` locally and upload public/build/."
else
    ok "public/build/ present"
fi

# ── 8. Storage permissions ────────────────────────────────────────────────────
# cPanel usually runs PHP under your user, so 755/775 is enough. Bump to 777
# only if your host has an odd setup — never on a shared box you don't own.
log "Fixing storage + bootstrap/cache permissions…"
chmod -R 775 storage bootstrap/cache || true
ok "permissions set"

# ── 9. Summary ────────────────────────────────────────────────────────────────
echo ""
ok "Deploy done. Next: add these two cron jobs in cPanel → Cron Jobs:"
cat <<'CRON'

    Scheduler (runs every minute, kicks off scheduled artisan commands):
    * * * * * cd $HOME/tfe && /usr/bin/php artisan schedule:run >> /dev/null 2>&1

    Queue worker (respawns every minute, drains the jobs table):
    * * * * * cd $HOME/tfe && /usr/bin/php artisan queue:work \
              --stop-when-empty --max-time=55 >> /dev/null 2>&1

Adjust $HOME/tfe and the php path to match your account layout.
CRON
