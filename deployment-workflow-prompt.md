# Prompt: Build a Production Deployment Workflow (Laravel + Inertia + React → Shared Hosting via GitHub Actions)

## Context

Stack: Laravel (backend), Inertia.js + React (frontend, SPA pages rendered through Laravel), Vite for asset bundling.

Target: shared cPanel-style hosting with **SSH access** (restricted/jailed shell, no root, no Docker, no systemd — assume only `php`, `composer`, `git`, `rsync`/`scp`, and standard POSIX tools are available). This is the **first production deployment** — no live user data exists yet, so it's safe to run one-time setup commands now, but the workflow itself must be safe to run on *every future push to `main`* without manual intervention or destructive side effects.

## Target Directory Layout on the Server

Confirm/adjust this structure with me before generating anything — I'm interpreting it as a "public webroot outside the app" pattern for security, common on shared Laravel hosting:

```
/home/tfe-core/                    ← Laravel application root (NOT web-accessible)
  ├── app/, bootstrap/, config/, database/, resources/, routes/, storage/
  ├── vendor/                      ← shipped from CI, not built on server
  ├── .env                        ← lives ONLY on server, never touched by deploy
  └── artisan

/home/tfe/public/                  ← web document root for tfe.okjtech.co.ke
  ├── build/                       ← compiled Vite assets (JS/CSS/manifest)
  ├── .htaccess
  ├── storage -> /home/tfe-core/storage/app/public   ← symlink, NOT a copy
  └── index.php                    ← modified Laravel front controller; paths below
                                       point at ../../tfe-core/... instead of ../

/home/api-tfe.okjtech.co.ke/public/index.php   ← (if a separate API subdomain
                                       document root exists) same pattern,
                                       pointing at the same /home/tfe-core/ app
```

> **Note to whoever builds this workflow:** the exact three paths above need to be verified against actual cPanel domain/subdomain document roots before writing the deploy job — don't assume, ask if unclear. If there is in fact only *one* web-facing entry point (Inertia serves both the SPA shell and the API from the same Laravel app), collapse the third bullet and just confirm that with me.

## What "done" looks like after every push to `main`

1. **Install & cache dependencies** — `composer install --no-dev --optimize-autoloader --prefer-dist` using a PHP version in CI that matches the server's PHP version exactly (pin via `actions/setup-php`, don't detect/install PHP on the server itself); `npm ci` for frontend deps.
2. **Lint/test/autofix, in this order, failing the build if tests fail:**
   - Backend autofix: `./vendor/bin/pint` (or your preferred fixer) — commit-free, just fixes the artifact being deployed, not the repo.
   - Frontend autofix: `eslint --fix` / `prettier --write`.
   - Run backend test suite (`php artisan test` / PHPUnit/Pest).
   - Run frontend tests if present.
   - **Stop the deploy** if tests fail after autofix — never deploy a red build.
3. **Build production assets** — `npm run build` (Vite), producing `public/build/`.
4. **Package the deploy artifact** — assemble exactly what needs to go to each server directory, excluding `.env`, `.git`, `node_modules`, `tests`, dev-only files.
5. **Clean stale build assets on the server** before uploading new ones (old hashed Vite chunks shouldn't accumulate forever in `public/build/`), but never delete `storage/`, `.env`, or the symlink.
6. **Sync files to the server over SSH** (`rsync -az --delete` scoped only to the specific subdirectories being managed, e.g. `public/build/`, application code — *not* a blanket delete-everything sync) to:
   - `/home/tfe-core/` — full app minus `public/`
   - `/home/tfe/public/` — built assets + `.htaccess` + `index.php`
   - the API entrypoint directory, if distinct
7. **Post-deploy remote commands over SSH** (idempotent, safe to run every deploy):
   ```
   cd /home/tfe-core

   # dependency correctness check (already installed via CI-shipped vendor/,
   # this is just a sanity check, not a live composer run)
   php artisan --version

   php artisan config:clear
   php artisan route:clear
   php artisan view:clear
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   php artisan migrate --force

   # storage symlink: check before creating, don't error on re-run
   [ -L /home/tfe/public/storage ] || php artisan storage:link

   # permissions
   find vendor -type d -exec chmod 755 {} +
   find vendor -type f -exec chmod 644 {} +
   find storage bootstrap/cache -type d -exec chmod 775 {} +
   ```
   **`php artisan key:generate --force` is explicitly excluded from this recurring workflow** — it's a one-time, manual, first-deploy-only command because rotating it later invalidates encrypted data and sessions.
8. **Zero/low-downtime consideration**: wrap steps 6–7 with `php artisan down --render="errors::503" --secret="..."` before syncing and `php artisan up` after, *only* while migrations are running, so requests during a schema change don't hit half-migrated state — but keep the maintenance window as short as possible given shared-hosting constraints (no blue/green, no symlink-swap releases unless we explicitly want to build that in).
9. **Post-deployment cleanup**: remove any temp files/artifacts created during the sync, clear old `public/build/` hashed assets no longer referenced by the current manifest.
10. **Verify expected file structure** after deploy — a final step that checks for the presence of `index.php`, `public/build/manifest.json`, the `storage` symlink target resolving correctly, and `vendor/autoload.php`, and fails the job loudly if anything is missing, so a broken deploy is caught in CI rather than discovered by users.

## Secrets/config the workflow will need in GitHub

- `SSH_HOST`, `SSH_USER`, `SSH_PORT`, `SSH_PRIVATE_KEY` (deploy key, restricted to what it needs)
- Server-side paths as environment variables/workflow inputs, not hardcoded inline repeatedly
- Nothing database- or app-secret related — those stay in the server's `.env`, which the workflow must never read, write, or overwrite

## Deliverable

A single `.github/workflows/deploy.yml` triggered on `push` to `main`, implementing steps 1–10 above as clearly named, separated jobs/steps (not one giant shell blob), plus any small helper shell scripts it depends on, with comments explaining each destructive or stateful action. Ask me to confirm the exact server paths and PHP version before finalizing rather than guessing.
