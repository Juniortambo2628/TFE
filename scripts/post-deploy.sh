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
# 6. STORAGE SYMLINK (frontend → backend storage)
# ─────────────────────────────────────────────
echo "─── Storage symlink ───"
if [ -L "$FRONTEND_PATH/storage" ]; then
  echo "Symlink already exists at $FRONTEND_PATH/storage, skipping"
else
  ln -s "$BACKEND_PATH/storage/app/public" "$FRONTEND_PATH/storage"
  echo "Created symlink: $FRONTEND_PATH/storage -> $BACKEND_PATH/storage/app/public"
fi

# ─────────────────────────────────────────────
# 7. PERMISSIONS
# ─────────────────────────────────────────────
echo "─── Setting permissions ───"
find "$BACKEND_PATH/vendor" -type d -exec chmod 755 {} +
find "$BACKEND_PATH/vendor" -type f -exec chmod 644 {} +
find "$BACKEND_PATH/storage" "$BACKEND_PATH/bootstrap/cache" -type d -exec chmod 775 {} +

echo "─── Post-deploy complete ───"
