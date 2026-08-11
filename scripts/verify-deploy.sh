#!/usr/bin/env bash
# Verify deployment — runs on the production server after post-deploy.sh.
# Fails loudly (non-zero exit) if anything is wrong, so GitHub Actions
# catches the failure instead of users discovering a broken site.
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

echo "═══════════════════════════════════════════"
echo "  POST-DEPLOYMENT VERIFICATION"
echo "═══════════════════════════════════════════"

echo ""
echo "─── PHP version ───"
PHP_VERSION=$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')
PHP_MAJOR=$(php -r 'echo PHP_MAJOR_VERSION;')
PHP_MINOR=$(php -r 'echo PHP_MINOR_VERSION;')
if [ "$PHP_MAJOR" -gt 8 ] || ([ "$PHP_MAJOR" -eq 8 ] && [ "$PHP_MINOR" -ge 2 ]); then
  echo "OK: PHP $PHP_VERSION (>= 8.2 required)"
else
  echo "FAIL: PHP $PHP_VERSION detected, but 8.2+ is required"
  FAIL=1
fi

echo ""
echo "─── Backend file structure ───"
check "$BACKEND_PATH/vendor/autoload.php"
check "$BACKEND_PATH/artisan"
check "$BACKEND_PATH/bootstrap/app.php"
check "$BACKEND_PATH/config/app.php"
check "$BACKEND_PATH/composer.json"

echo ""
echo "─── Frontend entry point ───"
check "$FRONTEND_PATH/index.php"
check "$FRONTEND_PATH/.htaccess"

echo ""
echo "─── Vite build assets ───"
if [ -d "$FRONTEND_PATH/build" ]; then
  ASSET_COUNT=$(find "$FRONTEND_PATH/build" -type f | wc -l)
  echo "OK: public/build/ ($ASSET_COUNT files)"
else
  echo "MISSING: public/build/ (Vite assets not built!)"
  FAIL=1
fi

# Check Vite manifest (location varies by laravel-vite-plugin version)
if [ -f "$FRONTEND_PATH/build/manifest.json" ] || [ -f "$FRONTEND_PATH/build/.vite/manifest.json" ]; then
  echo "OK: Vite manifest present"
else
  echo "MISSING: Vite build manifest"
  FAIL=1
fi

echo ""
echo "─── Storage symlink ───"
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

echo ""
echo "─── Write permissions ───"
if [ -w "$BACKEND_PATH/storage/logs" ]; then
  echo "OK: storage/logs is writable"
else
  echo "FAIL: storage/logs is NOT writable"
  FAIL=1
fi

if [ -w "$BACKEND_PATH/bootstrap/cache" ]; then
  echo "OK: bootstrap/cache is writable"
else
  echo "FAIL: bootstrap/cache is NOT writable"
  FAIL=1
fi

echo ""
echo "═══════════════════════════════════════════"
if [ "$FAIL" -eq 1 ]; then
  echo "  DEPLOYMENT VERIFICATION FAILED"
  exit 1
fi

echo "  DEPLOYMENT VERIFICATION PASSED"
echo "  $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "═══════════════════════════════════════════"
