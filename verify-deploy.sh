#!/usr/bin/env bash
# Runs on the production server via SSH after post-deploy.sh. Confirms the
# expected file structure exists and fails loudly (non-zero exit) if not,
# so a broken deploy is caught by GitHub Actions instead of by a user.
set -uo pipefail

: "${BACKEND_PATH:?BACKEND_PATH not set}"
: "${FRONTEND_PATH:?FRONTEND_PATH not set}"

FAIL=0

check() {
  if [ ! -e "$1" ]; then
    echo "MISSING: $1"
    FAIL=1
  else
    echo "OK: $1"
  fi
}

check "$BACKEND_PATH/vendor/autoload.php"
check "$BACKEND_PATH/artisan"
check "$BACKEND_PATH/.env"
check "$FRONTEND_PATH/index.php"
check "$FRONTEND_PATH/.htaccess"

# NOTE: laravel-vite-plugin >=1.0 writes the manifest to build/.vite/manifest.json;
# older versions write it to build/manifest.json. Check whichever applies to you,
# or check both.
if [ -f "$FRONTEND_PATH/build/manifest.json" ] || [ -f "$FRONTEND_PATH/build/.vite/manifest.json" ]; then
  echo "OK: Vite manifest present"
else
  echo "MISSING: Vite build manifest"
  FAIL=1
fi

if [ -L "$FRONTEND_PATH/storage" ]; then
  TARGET=$(readlink -f "$FRONTEND_PATH/storage")
  if [ -d "$TARGET" ]; then
    echo "OK: storage symlink resolves to $TARGET"
  else
    echo "BROKEN SYMLINK: $FRONTEND_PATH/storage -> $TARGET does not exist"
    FAIL=1
  fi
else
  echo "MISSING: storage symlink at $FRONTEND_PATH/storage"
  FAIL=1
fi

if [ "$FAIL" -eq 1 ]; then
  echo "Deployment verification FAILED"
  exit 1
fi

echo "Deployment verification PASSED"
