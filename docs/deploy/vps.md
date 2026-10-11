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

The deploy does everything else itself (folders, `.env`, storage links,
queue worker, scheduler). Only these two need root:

```bash
D=/home/dev/web/tfe.okjtech.co.ke
# Web root -> app (dev can't: the domain dir isn't writable by dev).
# It dangles until the first deploy, which is fine.
mv $D/public_html $D/public_html.hestia-default
ln -s private/tfe/current/public $D/public_html
chown -h dev:dev $D/public_html
# Bring dev's PM2 processes (queue worker + scheduler) back after a reboot
pm2 startup systemd -u dev --hp /home/dev
```
(Already done: `/etc/sudoers.d/tfe-deploy` lets `dev` reload PHP-FPM.)
If you forget the symlink, or Hestia rebuilds the domain and undoes it, the
deploy's verify step fails and prints this exact command.

### 2. The `.env`

**Recommended: a GitHub secret.** Repo → Settings → Secrets → Actions →
New secret `PROD_ENV`, paste the whole prepared `.env`. Every deploy writes
it to `shared/.env` (chmod 600), so changing a setting = edit the secret +
re-run the deploy. Don't also edit the file on the server: the next deploy
overwrites it.

**Or by hand** (leave `PROD_ENV` unset), as **dev** after the first deploy
attempt has created the folder:
```bash
mkdir -p ~/web/tfe.okjtech.co.ke/private/tfe/shared
nano ~/web/tfe.okjtech.co.ke/private/tfe/shared/.env && chmod 600 $_
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

### 5. Background processes

Nothing to do: each deploy (re)starts `tfe-queue` (`queue:work`) and
`tfe-scheduler` (`schedule:work`) under PM2 as dev, on the new release, and
`pm2 save`s them. Check with `pm2 status` / `pm2 logs tfe-queue`. No Hestia
cron job is needed.

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
   `cd ~/web/tfe.okjtech.co.ke/private/tfe/current && php artisan config:cache && sudo -n systemctl reload php8.3-fpm`
   (or, with `PROD_ENV`: edit the secret and re-run the deploy).
6. Old host: keep it for a week, then cancel. Delete the old GitHub secrets
   `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY`, `BACKEND_PATH`,
   `FRONTEND_PATH` — nothing reads them now.
