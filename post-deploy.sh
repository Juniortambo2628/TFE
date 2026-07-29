#!/usr/bin/env bash
# Runs on the production server via SSH after files have been synced.
# BACKEND_PATH and FRONTEND_PATH are exported by the workflow before this
# script runs. This script is idempotent — safe to run on every deploy.
set -euo pipefail

: "${BACKEND_PATH:?BACKEND_PATH not set}"
: "${FRONTEND_PATH:?FRONTEND_PATH not set}"

cd "$BACKEND_PATH"

echo "== Clearing stale caches =="
php artisan config:clear
php artisan route:clear
php artisan view:clear

# --- OPTIONAL: uncomment once you have real user traffic and want a short
# maintenance window around schema changes. Not enabled by default since
# this is a first deploy with no live traffic yet.
# php artisan down --render="errors::503" --retry=30

echo "== Running migrations =="
php artisan migrate --force

echo "== Rebuilding caches =="
php artisan config:cache
php artisan route:cache
php artisan view:cache

# php artisan up

echo "== Storage symlink =="
# NOTE: `php artisan storage:link` assumes Laravel's default public/ path.
# Because this setup splits the app root and the public webroot into two
# separate directories, we create the symlink manually instead so it points
# at the right place regardless of Laravel's internal public_path().
if [ -L "$FRONTEND_PATH/storage" ]; then
  echo "Symlink already exists at $FRONTEND_PATH/storage, skipping"
else
  ln -s "$BACKEND_PATH/storage/app/public" "$FRONTEND_PATH/storage"
  echo "Created symlink: $FRONTEND_PATH/storage -> $BACKEND_PATH/storage/app/public"
fi

echo "== Setting permissions =="
find "$BACKEND_PATH/vendor" -type d -exec chmod 755 {} +
find "$BACKEND_PATH/vendor" -type f -exec chmod 644 {} +
find "$BACKEND_PATH/storage" "$BACKEND_PATH/bootstrap/cache" -type d -exec chmod 775 {} +

echo "== Cleaning stale frontend build assets =="
# Vite fingerprints filenames on every build, so old hashed chunks pile up
# in build/assets over time. This removes anything older than 7 days that
# isn't referenced by the current manifest. Adjust the window as needed.
if [ -d "$FRONTEND_PATH/build/assets" ]; then
  find "$FRONTEND_PATH/build/assets" -type f -mtime +7 -delete || true
fi

echo "Post-deploy commands completed successfully."
