#!/usr/bin/env bash
# Runs on the production server via SSH after archives have been scp'd over.
# BACKEND_PATH, FRONTEND_PATH, and RELEASE_SHA are set by the workflow.
# All commands are idempotent — safe to run on every deploy.
set -euo pipefail

: "${BACKEND_PATH:?BACKEND_PATH not set}"
: "${FRONTEND_PATH:?FRONTEND_PATH not set}"
: "${RELEASE_SHA:?RELEASE_SHA not set}"

BACKEND_TARBALL="/tmp/backend-${RELEASE_SHA}.tar.gz"
FRONTEND_TARBALL="/tmp/frontend-build-${RELEASE_SHA}.tar.gz"

# ─────────────────────────────────────────────
# 1. CLEAR OLD FILES (replaces rsync --delete)
# ─────────────────────────────────────────────
echo "─── Clearing old backend files (preserving .env and storage) ───"
cd "$BACKEND_PATH"
find . -mindepth 1 -maxdepth 1 \
  ! -name '.env' \
  ! -name 'storage' \
  -exec rm -rf {} +

# ─────────────────────────────────────────────
# 2. EXTRACT NEW FILES
# ─────────────────────────────────────────────
echo "─── Extracting new backend files ───"
tar -xzf "$BACKEND_TARBALL" -C "$BACKEND_PATH"
rm -f "$BACKEND_TARBALL"

echo "─── Replacing frontend build assets ───"
rm -rf "$FRONTEND_PATH/build"
# Extract entire archive (contains build/, .htaccess, index.php at root)
tar -xzf "$FRONTEND_TARBALL" -C "$FRONTEND_PATH"
rm -f "$FRONTEND_TARBALL"

# Laravel expects the Vite manifest at BACKEND_PATH/public/build/
# Copy build assets there so Blade's @vite directive can find them
mkdir -p "$BACKEND_PATH/public"
cp -r "$FRONTEND_PATH/build" "$BACKEND_PATH/public/build"

cd "$BACKEND_PATH"

# ─────────────────────────────────────────────
# 3. CLEAR STALE CACHES
# ─────────────────────────────────────────────
echo "─── Clearing stale caches ───"
rm -f bootstrap/cache/services.php bootstrap/cache/packages.php
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# ─────────────────────────────────────────────
# 4. MIGRATIONS
# ─────────────────────────────────────────────
echo "─── Running migrations ───"
php artisan migrate --force

# ─────────────────────────────────────────────
# 5. REBUILD CACHES
# ─────────────────────────────────────────────
echo "─── Rebuilding caches ───"
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache 2>/dev/null || true

# ─────────────────────────────────────────────
# 6. STORAGE SYMLINKS (manual — `storage:link` is unusable on cPanel)
# ─────────────────────────────────────────────
# cPanel disables PHP's exec() in disable_functions, so
# `php artisan storage:link` errors with "Call to undefined function
# Illuminate\Filesystem\exec()". `ln -s` does the same job without
# needing exec().
#
# We create TWO symlinks, both pointing at the Laravel public disk root
# (config/filesystems.php → storage_path('app/public')):
#   1. Frontend: public_html/storage → tfe-core/storage/app/public
#      This is what serves /storage/*.jpg to browsers.
#   2. Backend: tfe-core/public/storage → tfe-core/storage/app/public
#      Some third-party packages use public_path('storage/...') to
#      resolve paths internally; without this they 404 even though the
#      frontend URL works.
#
# ensure_storage_symlink is SELF-CORRECTING: it creates the link when
# missing AND repoints it when it exists but targets the wrong path. Older
# setups sometimes left public_html/storage pointing at the whole
# storage/ dir (which also exposes storage/logs to the web) — the previous
# create-if-absent logic could never heal that. A real directory is left
# untouched so we never delete uploaded files.
ensure_storage_symlink() {
  local target="$1" link="$2"
  if [ -L "$link" ]; then
    if [ "$(readlink "$link")" = "$target" ]; then
      echo "Symlink already correct: $link -> $target"
      return
    fi
    echo "Repointing incorrect symlink: $link -> $(readlink "$link") (want $target)"
    rm -f "$link"
  elif [ -e "$link" ]; then
    echo "WARNING: $link exists but is not a symlink; leaving alone"
    return
  fi
  ln -s "$target" "$link"
  echo "Created symlink: $link -> $target"
}

echo "─── Frontend storage symlink ───"
ensure_storage_symlink "$BACKEND_PATH/storage/app/public" "$FRONTEND_PATH/storage"

echo "─── Backend storage symlink ───"
mkdir -p "$BACKEND_PATH/public"
ensure_storage_symlink "$BACKEND_PATH/storage/app/public" "$BACKEND_PATH/public/storage"

# ─────────────────────────────────────────────
# 7. PERMISSIONS
# ─────────────────────────────────────────────
echo "─── Setting permissions ───"
find "$BACKEND_PATH/vendor" -type d -exec chmod 755 {} +
find "$BACKEND_PATH/vendor" -type f -exec chmod 644 {} +
find "$BACKEND_PATH/storage" "$BACKEND_PATH/bootstrap/cache" -type d -exec chmod 775 {} +

# ─────────────────────────────────────────────
# 8. RESTART QUEUE WORKER
# ─────────────────────────────────────────────
# The cPanel cron worker respawns every minute; queue:restart signals
# any currently-running worker to exit at its next iteration so new
# code lands without waiting for --max-time=55 to time it out.
echo "─── Signalling queue workers to restart ───"
php artisan queue:restart

echo "─── Post-deploy complete ───"
