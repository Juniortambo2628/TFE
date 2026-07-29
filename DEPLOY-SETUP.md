# Setup Notes

## 1. Repo placement

Put these where GitHub Actions and the workflow expect them:

```
.github/workflows/deploy.yml
scripts/post-deploy.sh
scripts/verify-deploy.sh
```

## 2. GitHub Secrets to add (Settings → Secrets and variables → Actions)

| Secret | Value |
|---|---|
| `SSH_HOST` | your server hostname/IP |
| `SSH_PORT` | usually 22, but shared hosts sometimes use a custom port |
| `SSH_USER` | your SSH username |
| `SSH_PRIVATE_KEY` | private key for a deploy-only SSH key pair (see below) |
| `BACKEND_PATH` | e.g. `/home/tfe-core` |
| `FRONTEND_PATH` | e.g. `/home/tfe/public` |

Generate a dedicated deploy key rather than reusing your personal one:
```
ssh-keygen -t ed25519 -f deploy_key -C "github-actions-deploy" -N ""
```
Add `deploy_key.pub` to the server's `~/.ssh/authorized_keys`, and put the
contents of `deploy_key` (private half) into the `SSH_PRIVATE_KEY` secret.

## 3. One-time manual steps on the server (before the first automated run)

These are deliberately **not** in the workflow because they should only ever
run once:

```bash
ssh youruser@yourhost
cd /home/tfe-core
cp .env.example .env      # fill in real production values
php artisan key:generate  # only ever run this once, manually
```

Also confirm the two web document roots (`tfe.okjtech.co.ke` and, if it
exists as a separate subdomain, the API entry point) are pointed at the
right folders in cPanel, and that `public/index.php` in the frontend
directory has its `require` paths edited to reach `/home/tfe-core/vendor/autoload.php`
and `/home/tfe-core/bootstrap/app.php` — that edited `index.php` is exactly
the file the workflow syncs on every deploy, so make that edit once, verify
it works, then it just gets redeployed unchanged going forward.

## 4. Things to double-check before trusting this on `main`

- `PHP_VERSION` in the workflow matches your host's actual PHP version.
- The `extensions:` list in the `setup-php` step matches what your host has enabled.
- Your `npm run lint` / eslint config actually has a fixable ruleset — adjust the "Frontend autofix" step if your project uses a different script name.
- Whether `laravel-vite-plugin` writes your manifest to `build/manifest.json` or `build/.vite/manifest.json` (version-dependent) — `verify-deploy.sh` checks both, but worth confirming which one applies.
- Run the workflow once against a staging branch/path if you can, before pointing it at the real `main` → production path.

## 5. Handing this spec to an AI coding tool

If you want an AI (Claude Code, or Claude in a fresh chat) to adapt, extend,
or debug this workflow further, give it both:

1. This `DEPLOY-SETUP.md` plus the `deployment-workflow-prompt.md` spec from
   earlier — paste them in, or if using Claude Code, drop them in the repo
   root and say "read deployment-workflow-prompt.md and DEPLOY-SETUP.md,
   then adjust deploy.yml for X."
2. The actual current `deploy.yml`, `post-deploy.sh`, and `verify-deploy.sh`
   — an AI editing this blind, without seeing the real files, will likely
   redo work or contradict decisions already made here.

Because Claude Code runs directly in your repo with terminal access, it's
the better tool for *iterating* on this (testing SSH connectivity, tweaking
paths, debugging a failed run) versus a chat interface where you'd be
copy-pasting file contents back and forth each time.
