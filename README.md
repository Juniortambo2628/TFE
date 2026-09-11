# TFE — The Football Experience

Laravel 12 + Inertia + React 19 platform for planning trips to football
tournaments (World Cup, AFCON, Euro, …). Fans budget itineraries, book
packages from travel partners, and finance the trip via finance partners.

Original design by OKJTechnologies & Terik Tours.

## Quick start (dev)

```bash
composer install
npm install --legacy-peer-deps
cp .env.example .env && php artisan key:generate
php artisan migrate --force --seed
npx vite build
php artisan serve --host=127.0.0.1 --port=8000
```

Windows / WAMP: run `start-dev.bat` (or `.ps1`) — handles the above end to end.

Open http://localhost:8000 and log in with the seeded accounts:

| Role            | Email               | Password |
|-----------------|---------------------|----------|
| Admin           | `admin@tfe.com`     | password |
| Travel partner  | `partner@tfe.com`   | password |
| Finance partner | `finance@tfe.com`   | password |

Public partner directory: http://localhost:8000/partners

## Testing

```bash
./vendor/bin/pint --dirty     # format
./vendor/bin/phpunit          # 165 feature tests
npm run test:js               # currency default guard (Node --test)
```

## Contributing

See [CLAUDE.md](CLAUDE.md) for architecture, conventions, and sprint history.
Development happens on branch `claude/brave-newton-o8w4u0`; never push to
`main` without asking.
