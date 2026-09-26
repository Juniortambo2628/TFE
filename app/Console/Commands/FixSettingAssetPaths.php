<?php

namespace App\Console\Commands;

use App\Http\Controllers\Admin\ContentController;
use App\Models\SiteSetting;
use Illuminate\Console\Command;

/**
 * Repair image `SiteSetting` values that were stored without a leading slash.
 *
 * A bare relative path (`assets/img/IMG-15.jpg`) is resolved by the browser
 * against the CURRENT directory, so it 404s the moment it renders on a nested
 * route — that is where `GET /fan/assets/img/IMG-15.jpg 404` came from. The
 * config catalogues were fixed in Sprint 49 and `ContentController` now
 * normalises on save, but values already written to the database need this
 * one-off pass. Idempotent and safe to re-run; pass `--dry-run` to preview.
 */
class FixSettingAssetPaths extends Command
{
    protected $signature = 'tfe:fix-setting-asset-paths {--dry-run : List the rows that would change without writing}';

    protected $description = 'Normalise relative image SiteSetting values to root-relative paths';

    /** Key fragments that mark a SiteSetting whose value is an image path. */
    private const IMAGE_KEY_PATTERNS = [
        '_image', '_background', '_bg', 'hero_bg_', 'logo', 'favicon', 'trophy', 'card_bg',
    ];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $fixed = 0;

        foreach (SiteSetting::all() as $setting) {
            if (! $this->looksLikeImage($setting)) {
                continue;
            }

            $original = $setting->value;
            if (! is_string($original) || trim($original) === '') {
                continue;
            }

            $normalized = ContentController::normalizeAssetPath($original);
            if ($normalized === $original) {
                continue;
            }

            $this->line(sprintf('%s: %s → %s', $setting->key, $original, $normalized));
            $fixed++;

            if (! $dryRun) {
                $setting->value = $normalized;
                $setting->save();
            }
        }

        if ($fixed === 0) {
            $this->info('No relative image paths found — nothing to fix.');

            return self::SUCCESS;
        }

        $this->info($dryRun
            ? "{$fixed} row(s) would be updated (dry run — nothing written)."
            : "{$fixed} row(s) updated.");

        return self::SUCCESS;
    }

    private function looksLikeImage(SiteSetting $setting): bool
    {
        if (($setting->type ?? null) === 'image') {
            return true;
        }

        $key = strtolower($setting->key);
        foreach (self::IMAGE_KEY_PATTERNS as $pattern) {
            if (str_contains($key, $pattern)) {
                return true;
            }
        }

        return false;
    }
}
