#!/usr/bin/env bash
# Post-deploy commands — runs on the production server after files are synced.
# All commands are idempotent (safe to run on every deploy).
set -euo pipefail

: "${BACKEND_PATH:?BACKEND_PATH not set}"

cd "$BACKEND_PATH"

echo "─── Clear stale bootstrap caches ───"
rm -f bootstrap/cache/services.php bootstrap/cache/packages.php

echo "─── Discover packages ───"
php artisan package:discover --ansi 2>/dev/null || true

echo "─── Clear & rebuild caches ───"
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache 2>/dev/null || true

echo "─── Run migrations ───"
php artisan migrate --force

echo "─── Storage symlink ───"
if ! php artisan storage:link --force 2>/dev/null; then
  echo "php artisan storage:link failed, creating manually..."
  rm -rf public/storage
  ln -sfn ../storage/app/public public/storage
  echo "Manual storage symlink created."
fi

echo "─── Set permissions ───"
find vendor -type d -exec chmod 755 {} +
find vendor -type f -exec chmod 644 {} +
find storage bootstrap/cache -type d -exec chmod 775 {} +

echo "─── Post-deploy complete ───"
