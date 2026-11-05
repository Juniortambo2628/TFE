<?php

namespace App\Support;

use App\Models\SiteSetting;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * The copy of landing page v2 and its walkthrough pages: config/landing_v2.php
 * with admin overrides on top (UX review, 2 Nov 2026, plan item C4).
 *
 * An override is a SiteSetting row keyed `landing_v2_{dot.path}`, e.g.
 * `landing_v2_hero.title` or `landing_v2_faq.items.2.a`, saved from Admin ->
 * Content -> Landing v2 through the existing settings endpoint. Only TEXT
 * leaves can be overridden: a key whose last segment is structural (an id,
 * icon, partner type, link action or image path) is ignored, so a CMS edit
 * can change what the page says but never how it is wired. An empty override
 * means "use the config default", which is how every other CMS field here
 * behaves.
 */
class LandingContent
{
    public const PREFIX = 'landing_v2_';

    /** Leaf names that are wiring, not wording — never overridable or listed. */
    public const STRUCTURAL = ['id', 'icon', 'area', 'action', 'types', 'image', 'phone', 'desktop', 'background'];

    /** The merged content: config defaults with saved overrides applied. */
    public static function all(): array
    {
        $content = config('landing_v2', []);
        $overrides = self::overrides();

        foreach (self::textLeaves($content) as $path => $default) {
            $value = $overrides[self::PREFIX.$path] ?? null;
            if (is_string($value) && trim($value) !== '') {
                Arr::set($content, $path, $value);
            }
        }

        return $content;
    }

    /**
     * Every overridable field, for the admin editor: its setting key, the
     * section it belongs to, a readable label, the config default and the
     * saved value.
     *
     * @return array<int, array{key: string, group: string, label: string, default: string, value: ?string, multiline: bool}>
     */
    public static function editable(): array
    {
        $overrides = self::overrides();
        $fields = [];

        foreach (self::textLeaves(config('landing_v2', [])) as $path => $default) {
            $segments = explode('.', $path);
            $group = $segments[0] === 'walkthroughs' ? 'walkthroughs.'.($segments[1] ?? '') : $segments[0];

            $fields[] = [
                'key' => self::PREFIX.$path,
                'group' => $group,
                'label' => self::label($path, $group),
                'default' => $default,
                'value' => $overrides[self::PREFIX.$path] ?? null,
                'multiline' => mb_strlen($default) > 70,
            ];
        }

        return $fields;
    }

    /**
     * String leaves of the content tree, keyed by dot path, skipping
     * structural ones.
     *
     * @return array<string, string>
     */
    public static function textLeaves(array $tree, string $prefix = ''): array
    {
        $leaves = [];

        foreach ($tree as $key => $value) {
            $path = $prefix === '' ? (string) $key : "{$prefix}.{$key}";

            if (is_array($value)) {
                // A list of plain strings (`points`) is copy; a list under a
                // structural key (`types`) is wiring.
                if (in_array((string) $key, self::STRUCTURAL, true)) {
                    continue;
                }
                $leaves += self::textLeaves($value, $path);
            } elseif (is_string($value) && ! in_array((string) $key, self::STRUCTURAL, true)) {
                $leaves[$path] = $value;
            }
        }

        return $leaves;
    }

    /** "faq.items.2.a" -> "Item 3 — answer"; "hero.title" -> "Title". */
    private static function label(string $path, string $group): string
    {
        $rest = Str::after($path, $group.'.');
        $words = [];

        foreach (explode('.', $rest) as $segment) {
            if (ctype_digit($segment)) {
                $words[] = '#'.((int) $segment + 1);

                continue;
            }
            $words[] = match ($segment) {
                'q' => 'question',
                'a' => 'answer',
                'cta' => 'call to action',
                default => str_replace('_', ' ', $segment),
            };
        }

        return Str::ucfirst(implode(' › ', $words));
    }

    /** @return array<string, string> */
    private static function overrides(): array
    {
        try {
            if (! Schema::hasTable('site_settings')) {
                return [];
            }

            return SiteSetting::query()
                ->where('key', 'like', self::PREFIX.'%')
                ->pluck('value', 'key')
                ->all();
        } catch (\Throwable $e) {
            // Best-effort, like pageHero(): the config defaults still render.
            return [];
        }
    }
}
