<?php

namespace Tests\Unit;

use App\Services\WikipediaService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Sprint 56 — Wikipedia's "Qualified teams" section is a table, and every
 * wikilink in it used to become a "team". The fan profile's team picker
 * therefore offered `1962`, `2004`, `WR`, `FIFA ranking` and `Legit.ng`
 * beside the nations, each drawn with a generic football icon because none
 * of them has a flag.
 *
 * These fixtures are shared with tests/JS/teamOptions.test.mjs, which asserts
 * them against the client mirror in resources/js/lib/teamOptions.js. Change
 * one side and the other must change in the same commit.
 */
class TeamNameSanitationTest extends TestCase
{
    /** @return string[] */
    public static function realTeams(): array
    {
        return array_map(fn ($n) => [$n], [
            'Algeria', 'Cabo Verde', 'Cameroon', "Cote d'Ivoire", "Côte d'Ivoire",
            'Egypt', 'Ghana', 'Morocco', 'Nigeria', 'Senegal', 'South Africa',
            'Tanzania', 'Tunisia', 'Uganda', 'Burkina Faso', 'Guinea-Bissau',
            'DR Congo', 'Korea Republic', 'IR Iran', 'Chad', 'Mali', 'Togo',
        ]);
    }

    /** @return string[] */
    public static function junk(): array
    {
        return array_map(fn ($n) => [$n], [
            '1962', '1972', '1978', '2004', '2019', '2025',
            'WR', 'FIFA ranking', 'Legit.ng', 'Pos', '—', '', '   ',
            'Qualification', 'Group A', 'Venues', '2026 FIFA World Cup qualification',
        ]);
    }

    #[DataProvider('realTeams')]
    public function test_real_nations_survive(string $name): void
    {
        $this->assertTrue(
            WikipediaService::isLikelyTeamName($name),
            "{$name} is a nation and must be kept"
        );
    }

    #[DataProvider('junk')]
    public function test_table_furniture_is_rejected(string $name): void
    {
        $this->assertFalse(
            WikipediaService::isLikelyTeamName($name),
            "{$name} is table furniture and must be dropped"
        );
    }

    public function test_three_letter_codes_go_but_four_letter_nations_stay(): void
    {
        $this->assertTrue(WikipediaService::isLikelyTeamName('Cuba'));
        $this->assertFalse(WikipediaService::isLikelyTeamName('ALG'));
    }

    public function test_null_is_not_a_team(): void
    {
        $this->assertFalse(WikipediaService::isLikelyTeamName(null));
    }
}
