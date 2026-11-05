<?php

namespace App\Support;

/**
 * Which design a public page renders in (UX review, Nov 2026).
 *
 * Every public page has a v2 twin under /v2/... served by the SAME controller
 * action, so the two versions can never show different data — only the
 * design differs. The V2PublicPages middleware marks those requests; a
 * controller names its page through here and gets `V2/{name}` back.
 */
class PageVersion
{
    public const ATTRIBUTE = 'tfe.v2_page';

    public static function isV2(): bool
    {
        return (bool) request()->attributes->get(self::ATTRIBUTE, false);
    }

    /** The Inertia component for this request: `V2/{name}` on a /v2 page. */
    public static function component(string $name): string
    {
        return self::isV2() ? "V2/{$name}" : $name;
    }
}
