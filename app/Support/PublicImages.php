<?php

namespace App\Support;

/**
 * Photography for the public pages outside config (Nov 2026): the hero
 * fallbacks pages draw when a partner, tribe or resource has no image of
 * its own, the closing band and the sign-in photo.
 *
 * The files are generated (prompts in the "TFE public-page image prompts"
 * doc) and live in public/assets/img/public/. A slot only switches to its
 * photo once the file is committed; until then it keeps the image it had,
 * so nothing renders broken in between.
 */
class PublicImages
{
    public const DIR = 'assets/img/public/';

    /** slot => [generated file, current image] */
    public const SLOTS = [
        'partners' => ['hero-partners.webp', '/assets/img/backdrops/stadium-fans.jpg'],
        'learn' => ['hero-learn.webp', '/assets/img/backdrops/field-night.jpg'],
        'tribes' => ['hero-tribes.webp', '/assets/img/backdrops/argentina-fans.jpg'],
        'closing' => ['closing-band.webp', null],
        'auth' => ['auth-hero.webp', null],
    ];

    /** @return array<string, string|null> slot => url (null = keep the component's own default) */
    public static function all(): array
    {
        $out = [];
        foreach (self::SLOTS as $slot => [$file, $fallback]) {
            $out[$slot] = self::photo($file, $fallback);
        }

        return $out;
    }

    public static function photo(string $file, ?string $fallback = null): ?string
    {
        return is_file(public_path(self::DIR.$file)) ? '/'.self::DIR.$file : $fallback;
    }
}
