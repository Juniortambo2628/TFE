#!/usr/bin/env bash
# ==============================================================================
# TFE — post-deploy structure + smoke check. Runs as `dev` on the VPS, called
# by the deploy workflow. Exits non-zero (failing the workflow) on any problem.
# Safe to run by hand any time:  bash ~/web/tfe.okjtech.co.ke/private/tfe/current/deploy/vps-verify.sh
# ==============================================================================
set -uo pipefail

DOMAIN="${DOMAIN:-tfe.okjtech.co.ke}"
DOMAIN_DIR="${DOMAIN_DIR:-/home/dev/web/$DOMAIN}"
APP_ROOT="${APP_ROOT:-$DOMAIN_DIR/private/tfe}"
CUR="$APP_ROOT/current"
SHARED="$APP_ROOT/shared"
FAIL=0

ok()   { printf '  ok    %s\n' "$*"; }
bad()  { printf '  FAIL  %s\n' "$*"; FAIL=1; }
check(){ local desc="$1"; shift; if "$@"; then ok "$desc"; else bad "$desc"; fi; }
same() { [[ "$(readlink -f "$1" 2>/dev/null)" == "$(readlink -f "$2" 2>/dev/null)" ]]; }

echo "Structure:"
check "current points at a release"            test -d "$CUR"
check "web root public_html -> current/public" same "$DOMAIN_DIR/public_html" "$CUR/public"
check ".env -> shared/.env"                    same "$CUR/.env" "$SHARED/.env"
check "storage -> shared/storage"              same "$CUR/storage" "$SHARED/storage"
check "public/storage -> shared uploads"       same "$CUR/public/storage" "$SHARED/storage/app/public"
check "vendor/autoload.php present"            test -f "$CUR/vendor/autoload.php"
check "Vite manifest present"                  test -f "$CUR/public/build/manifest.json"
check "public/index.php present"               test -f "$CUR/public/index.php"
check "config cache built"                     test -f "$CUR/bootstrap/cache/config.php"
check "storage/logs writable"                  test -w "$SHARED/storage/logs"
check "framework/views writable"               test -w "$SHARED/storage/framework/views"
check ".env not world-readable"                test "$(stat -c %a "$SHARED/.env")" = 600

echo "HTTP (local, bypassing DNS):"
code() {
  curl -s -o /dev/null -w '%{http_code}' -L --max-time 20 -k \
    --resolve "$DOMAIN:80:127.0.0.1" --resolve "$DOMAIN:443:127.0.0.1" "$1"
}
c="$(code "http://$DOMAIN/")";            [[ "$c" == 200 ]] && ok "home page 200"            || bad "home page returned $c (see $SHARED/storage/logs/laravel.log)"
c="$(code "http://$DOMAIN/robots.txt")";  [[ "$c" == 200 ]] && ok "static file 200"          || bad "static file returned $c"
ASSET="$(grep -o '"file": *"assets/[^"]*\.css"' "$CUR/public/build/manifest.json" | head -1 | sed 's/.*"assets/assets/; s/"$//')"
if [[ -n "$ASSET" ]]; then
  c="$(code "http://$DOMAIN/build/$ASSET")"; [[ "$c" == 200 ]] && ok "built asset 200" || bad "built asset /build/$ASSET returned $c"
fi

if [[ $FAIL -ne 0 ]]; then echo "Verification FAILED"; exit 1; fi
echo "Verification passed — $(basename "$(readlink -f "$CUR")") is live."
