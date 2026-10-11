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
if ! same "$DOMAIN_DIR/public_html" "$CUR/public"; then
  bad "web root public_html is not linked to current/public — run once as ROOT:"
  echo "        mv $DOMAIN_DIR/public_html $DOMAIN_DIR/public_html.hestia-default && ln -s private/tfe/current/public $DOMAIN_DIR/public_html && chown -h dev:dev $DOMAIN_DIR/public_html"
else
  ok "web root public_html -> current/public"
fi
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

echo "Processes:"
for p in tfe-queue tfe-scheduler; do
  st="$(pm2 jlist 2>/dev/null | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const p=JSON.parse(d||"[]").find(x=>x.name===process.argv[1]);console.log(p?p.pm2_env.status:"missing")})' "$p")"
  if [[ "$st" == online ]]; then ok "$p online"; else bad "$p is $st (pm2 logs $p)"; fi
done
# "online" can hide a crash loop; give them a moment, then check restarts.
sleep 10
for p in tfe-queue tfe-scheduler; do
  r="$(pm2 jlist 2>/dev/null | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const p=JSON.parse(d||"[]").find(x=>x.name===process.argv[1]);console.log(p?p.pm2_env.restart_time:-1)})' "$p")"
  if [[ "$r" == 0 ]]; then ok "$p stable (no restarts)"; else bad "$p restarted $r times (pm2 logs $p --lines 50)"; fi
done

# Hestia's nginx listens on the server's public IP, not 127.0.0.1, so aim
# the request there (still bypassing DNS, which may point elsewhere).
IP="${VERIFY_IP:-$(hostname -I | awk '{print $1}')}"
echo "HTTP (via $IP, bypassing DNS):"
code() {
  # Generous timeout: the first request after a deploy warms the caches
  # (tournament data, config) and can take well over 20s.
  curl -s -o /dev/null -w '%{http_code}' -L --max-time 90 -k \
    --resolve "$DOMAIN:80:$IP" --resolve "$DOMAIN:443:$IP" "$1"
}
c="$(code "http://$DOMAIN/")";            [[ "$c" == 200 ]] && ok "home page 200"            || bad "home page returned $c (see $SHARED/storage/logs/laravel.log)"
c="$(code "http://$DOMAIN/robots.txt")";  [[ "$c" == 200 ]] && ok "static file 200"          || bad "static file returned $c"
ASSET="$(grep -o '"file": *"assets/[^"]*\.css"' "$CUR/public/build/manifest.json" | head -1 | sed 's/.*"assets/assets/; s/"$//')"
if [[ -n "$ASSET" ]]; then
  c="$(code "http://$DOMAIN/build/$ASSET")"; [[ "$c" == 200 ]] && ok "built asset 200" || bad "built asset /build/$ASSET returned $c"
fi

if [[ $FAIL -ne 0 ]]; then echo "Verification FAILED"; exit 1; fi
echo "Verification passed — $(basename "$(readlink -f "$CUR")") is live."
