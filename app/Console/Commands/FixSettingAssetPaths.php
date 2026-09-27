<?php

namespace App\Console\Commands;

use App\Http\Controllers\Admin\ContentController;
use App\Models\SiteSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Repair stored image paths that were written without a leading slash.
 *
 * A bare relative path (`assets/img/IMG-15.jpg`) is resolved by the browser
 * against the CURRENT directory, so it 404s the moment it renders on a nested
 * route — that is where `GET /fan/assets/img/IMG-15.jpg 404` came from. The
 * config catalogues were fixed in Sprint 49 and `ContentController` now
 * normalises on save, but values already written to the database need this
 * one-off pass. Idempotent and safe to re-run; pass `--dry-run` to preview.
 *
 * Covers `SiteSetting` values AND the image columns on the content tables —
 * the seeded partner offerings carried bare paths too, which is why the budget
 * calculator was still asking for `/fan/assets/img/IMG-15.jpg` long after the
 * config side was clean (Sprint 58).
 */
class FixSettingAssetPaths extends Command
{
    protected $signature = 'tfe:fix-asset-paths {--dry-run : List the rows that would change without writing}';

    protected $description = 'Normalise relative image paths (settings + content rows) to root-relative';

    /**
     * Image columns on the content tables, table => columns.
     *
     * Explicit rather than guessed from a name: rewriting the wrong column
     * would corrupt real data, and a column that is not a path must never be
     * touched. Tables/columns that do not exist on an install are skipped.
     */
    private const IMAGE_COLUMNS = [
        'listings' => ['hero_image'],
        'tickets' => ['hero_image'],
        'partner_profiles' => ['hero_image', 'logo_url'],
        'users' => ['avatar'],
        'news' => ['image'],
        'events' => ['image'],
    ];

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

        $fixed += $this->fixContentRows($dryRun);

        if ($fixed === 0) {
            $this->info('No relative image paths found — nothing to fix.');

            return self::SUCCESS;
        }

        $this->info($dryRun
            ? "{$fixed} row(s) would be updated (dry run — nothing written)."
            : "{$fixed} row(s) updated.");

        return self::SUCCESS;
    }

    /**
     * Sweep the content tables' image columns.
     *
     * Matched on `assets/%` specifically, not "anything without a slash": a
     * storage-relative upload path (`uploads/…`) is resolved by a different
     * mechanism and must be left alone.
     */
    private function fixContentRows(bool $dryRun): int
    {
        $fixed = 0;

        foreach (self::IMAGE_COLUMNS as $table => $columns) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            foreach ($columns as $column) {
                if (! Schema::hasColumn($table, $column)) {
                    continue;
                }

                $rows = DB::table($table)
                    ->select('id', $column)
                    ->where($column, 'like', 'assets/%')
                    ->get();

                foreach ($rows as $row) {
                    $original = $row->{$column};
                    $normalized = ContentController::normalizeAssetPath($original);

                    if ($normalized === $original) {
                        continue;
                    }

                    $this->line(sprintf('%s#%d.%s: %s → %s', $table, $row->id, $column, $original, $normalized));
                    $fixed++;

                    if (! $dryRun) {
                        DB::table($table)->where('id', $row->id)->update([$column => $normalized]);
                    }
                }
            }
        }

        return $fixed;
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
