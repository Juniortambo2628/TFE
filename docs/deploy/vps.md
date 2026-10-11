# Deploying TFE to the VPS

Truehost VPS · Debian 12 · Hestia · `102.212.246.224` · Hestia user `dev`.
Deploys are fully automatic: push to `main` → **Test and Autofix** passes →
**Deploy to VPS** (`.github/workflows/deploy.yml`) ships that exact commit.

## Layout

```
/home/dev/web/tfe.okjtech.co.ke/
  public_html -> private/tfe/current/public     # web root (symlink, made once by root)
  private/tfe/
    releases/20261011120000-abc1234/            # one per deploy, last 5 kept
    shared/.env                                 # persistent, chmod 600
    shared/storage/                             # persistent: uploads, logs, sessions, cache
    current -> releases/<live release>
```

**Why under `private/`.** Hestia's PHP-FPM pool for this domain sets
`open_basedir = …/public_html:…/private:/home/dev/tmp:/tmp:…`, and PHP checks
the *resolved* path behind a symlink. `private/` is inside it and is never
served by the web server, so the code, `vendor/` and `.env` are unreachable
from a browser. Hestia's "custom document root" can only point at another
domain's `public_html`, so the web root is a symlink instead — nginx and
Apache both follow it (everything is owned by `dev`).

**How a deploy works.** The runner builds (`composer install --no-dev`,
`npm run build`) and rsyncs into a new release folder, hard-linking unchanged
files against the live one. `deploy/vps-deploy.sh` then links `.env` +
`storage`, sets permissions, runs `migrate --force` + the (idempotent,
non-fatal) seeders + `tfe:fix-asset-paths`, builds the caches, and only then
swaps `current` atomically, reloads PHP-FPM (clears OPcache) and signals the
queue worker. A failure before the swap leaves the live site untouched.
`deploy/vps-verify.sh` then checks the structure and requests the home page,
a static file and a built asset from the VPS itself.

**Rollback** (as `dev`):
```bash
cd ~/web/tfe.okjtech.co.ke/private/tfe && ls releases/
ln -sfn "$PWD/releases/<previous>" current.new && mv -Tf current.new current
sudo -n systemctl reload php8.3-fpm && php current/artisan queue:restart
```
Migrations are not rolled back by this — only code.

---

## First deploy

### 1. One-time server setup — as **root** (`ssh vps1`)

```bash
D=/home/dev/web/tfe.okjtech.co.ke
# App directories
install -d -o dev -g dev -m 755 $D/private/tfe $D/private/tfe/releases
install -d -o dev -g dev -m 711 $D/private/tfe/shared
# Replace Hestia's placeholder web root with the symlink (dev can't: the
# domain dir is not writable by dev). It dangles until the first deploy.
mv $D/public_html $D/public_html.hestia-default
ln -s private/tfe/current/public $D/public_html
chown -h dev:dev $D/public_html
# Queue worker on boot (PM2 under dev)
env PATH=$PATH:/usr/bin pm2 startup systemd -u dev --hp /home/dev
# Laravel scheduler, as a Hestia cron job for dev
/usr/local/hestia/bin/v-add-cron-job dev '*' '*' '*' '*' '*' "cd $D/private/tfe/current && php artisan schedule:run >> /dev/null 2>&1"
```
(Already done: `/etc/sudoers.d/tfe-deploy` lets `dev` run
`systemctl reload php8.3-fpm`.)

If Hestia ever rebuilds the domain (`v-rebuild-web-domains`) and
`public_html` turns back into a directory, re-run the `mv`/`ln` lines.

### 2. The `.env` — as **dev** (`su - dev`)

```bash
nano ~/web/tfe.okjtech.co.ke/private/tfe/shared/.env    # paste your prepared .env
chmod 600 ~/web/tfe.okjtech.co.ke/private/tfe/shared/.env
```
Must have: `APP_KEY` = the **old production key** (otherwise passkeys and
encrypted bank links can't be decrypted and everyone is logged out),
`APP_DEBUG=false`, `APP_URL=https://tfe.okjtech.co.ke`, `DB_CONNECTION=mysql`,
`DB_HOST=localhost`, `DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD` from Hestia
(Hestia prefixes them: `dev_…`), `QUEUE_CONNECTION=database`,
`DEMO_ACCOUNT_PASSWORD`.

**`APP_ENV` while testing over plain HTTP:** in `production` the app forces
`https://` on every generated URL (`AppServiceProvider`), so before SSL is on
the CSS/JS links point at https and the hosts-file test looks broken. Use
`APP_ENV=staging` until Let's Encrypt is enabled, then set `production` (see
cutover step 5).

### 3. Database + uploads — import BEFORE the first deploy

Export from the **old cPanel host** (cPanel → Terminal):
```bash
mysqldump --single-transaction --no-tablespaces -u CPANEL_DB_USER -p CPANEL_DB_NAME | gzip > ~/tfe-db.sql.gz
tar -czf ~/tfe-uploads.tar.gz -C ~/tfe-core/storage/app public
```
(Or phpMyAdmin → database → Export → Quick/SQL, gzipped.) Download both via
cPanel File Manager. Then, from **Windows PowerShell**, send them straight to
the VPS — no size limit applies:
```powershell
scp -i C:\Users\kevin\Downloads\github_deploy tfe-db.sql.gz tfe-uploads.tar.gz dev@102.212.246.224:/home/dev/tmp/
```

Import — as **dev**:
```bash
cd ~/tmp
# Database (Hestia DB names/users are prefixed, e.g. dev_tfe)
gunzip -c tfe-db.sql.gz | mysql -u dev_TFEUSER -p dev_TFEDB
# Uploads into the persistent storage
mkdir -p ~/web/tfe.okjtech.co.ke/private/tfe/shared/storage/app
tar -xzf tfe-uploads.tar.gz -C ~/web/tfe.okjtech.co.ke/private/tfe/shared/storage/app
ls ~/web/tfe.okjtech.co.ke/private/tfe/shared/storage/app/public | head
rm tfe-db.sql.gz tfe-uploads.tar.gz
```
The first deploy then runs only the migrations newer than the dump.

### 4. Deploy

Merge to `main` (or Actions → **Deploy to VPS** → Run workflow). Watch the
"Verify the deployed site" step — it must end with `Verification passed`.

### 5. Start the queue worker — as **dev**, once after the first deploy

```bash
pm2 start /home/dev/web/tfe.okjtech.co.ke/private/tfe/current/artisan \
  --name tfe-queue --interpreter php -- queue:work --sleep=3 --tries=3 --max-time=3600
pm2 save
```
Each deploy's `queue:restart` makes it exit; PM2 restarts it on the new
release. Check with `pm2 status` / `pm2 logs tfe-queue`.

---

## Cutover checklist

1. **Hosts-file test (Windows).** Notepad **as Administrator** → open
   `C:\Windows\System32\drivers\etc\hosts` → add
   `102.212.246.224 tfe.okjtech.co.ke` → save → `ipconfig /flushdns`.
   Browse `http://tfe.okjtech.co.ke` (plain http; use a private window).
   Check: landing page + images, `/storage/...` uploads, login as
   `admin@tfe.com`, an admin page, a fan page. Logs:
   `tail -f ~/web/tfe.okjtech.co.ke/private/tfe/shared/storage/logs/laravel.log`.
2. **Final data sync** (if the old site took writes since step 3): put the
   old site in maintenance, re-export + re-import the DB and uploads.
3. **DNS.** At your DNS host, set the `A` record for `tfe` (okjtech.co.ke)
   to `102.212.246.224` (lower the TTL to 300 a few hours beforehand). Remove
   any `AAAA` record for `tfe`. Remove the hosts-file line, then confirm with
   `nslookup tfe.okjtech.co.ke 8.8.8.8`.
4. **SSL.** Once DNS resolves to the VPS: Hestia → Web → tfe.okjtech.co.ke →
   Edit → tick **Enable SSL** + **Use Lets Encrypt** + **Enable automatic
   HTTPS redirection** (+ HSTS once you're happy) → Save.
5. **Production mode.** In `shared/.env` set `APP_ENV=production`, then as dev:
   `cd ~/web/tfe.okjtech.co.ke/private/tfe/current && php artisan config:cache && sudo -n systemctl reload php8.3-fpm`.
6. Old host: keep it for a week, then cancel. Delete the old GitHub secrets
   `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY`, `BACKEND_PATH`,
   `FRONTEND_PATH` — nothing reads them now.
