<?php

namespace Database\Seeders;

use App\Models\Listing;
use App\Services\FixtureService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * PackageSeeder — Creates realistic demo packages for every tournament in
 * config/tournaments.php. Idempotent: reruns skip tournaments that already
 * have packages, so `php artisan db:seed --class=PackageSeeder` after the
 * first run is a no-op.
 *
 * Each tournament gets four packages spanning the price/audience spectrum:
 *   - Explorer   : short trip, group-stage matches, budget stay
 *   - Superfan   : full-tournament coverage, business flight, 4-star
 *   - VIP Final  : short trip aimed at the knockout rounds, 5-star
 *   - Family     : mid-range, 4-star, weekend group-stage window
 */
class PackageSeeder extends Seeder
{
    public function run(): void
    {
        $fixtureService = app(FixtureService::class);

        foreach (config('tournaments.tournaments', []) as $id => $config) {
            // Skip a tournament that already has packages — don't
            // stomp on manual admin curation.
            if (Listing::forTournament($id)->ofType('package')->exists()) {
                $this->command->info("Skipping {$id} (packages already exist).");

                continue;
            }

            $currency = $config['pricing']['currency'] ?? 'USD';
            $status = $config['status'] ?? 'upcoming';

            // Best-effort fetch of fixtures — some tournaments have none
            // (data source down, or config not wired). Packages still
            // seed with empty match lists; admin can add them later.
            try {
                $fixtures = $fixtureService->getFixtures($id);
            } catch (\Throwable $e) {
                $fixtures = [];
            }

            $groupIds = collect($fixtures)
                ->filter(fn ($f) => str_contains(strtolower($f['stage'] ?? ''), 'group'))
                ->take(3)
                ->pluck('id')
                ->toArray();

            $koIds = collect($fixtures)
                ->filter(fn ($f) => ! str_contains(strtolower($f['stage'] ?? ''), 'group'))
                ->take(4)
                ->pluck('id')
                ->toArray();

            $familyIds = collect($fixtures)
                ->filter(fn ($f) => str_contains(strtolower($f['stage'] ?? ''), 'group'))
                ->take(2)
                ->pluck('id')
                ->toArray();

            $venuesFromMatches = fn (array $ids) => collect($fixtures)
                ->filter(fn ($f) => in_array($f['id'], $ids, true))
                ->pluck('venue')
                ->filter()
                ->unique()
                ->values()
                ->toArray();

            $short = $config['short_name'] ?? $config['name'];
            $hostList = implode(' + ', $config['hosts'] ?? ['host cities']);

            $templates = [
                [
                    'name' => "{$short} Explorer",
                    'description' => "Dip your toes into {$short} with a short-and-sweet trip built around three group-stage matches across {$hostList}. Perfect for first-time travellers.",
                    'base_price' => $this->priceFor($config, 'explorer'),
                    'nights' => 6,
                    'flight_class' => 'economy',
                    'accommodation_level' => '3_star',
                    'capacity' => 40,
                    'sold_count' => 12,
                    'is_featured' => false,
                    'included_match_ids' => $groupIds,
                    'included_venues' => $venuesFromMatches($groupIds),
                    'display_order' => 40,
                ],
                [
                    'name' => "{$short} Superfan",
                    'description' => "Follow the drama all the way through {$short}: three group games plus a full knockout run. Business-class flight and 4-star stays keep the pace comfortable.",
                    'base_price' => $this->priceFor($config, 'superfan'),
                    'nights' => 14,
                    'flight_class' => 'business',
                    'accommodation_level' => '4_star',
                    'capacity' => 25,
                    'sold_count' => 18,
                    'is_featured' => true,
                    'included_match_ids' => array_merge($groupIds, $koIds),
                    'included_venues' => $venuesFromMatches(array_merge($groupIds, $koIds)),
                    'display_order' => 10,
                ],
                [
                    'name' => "{$short} VIP Final Weekend",
                    'description' => 'Fly in for the semi-finals and stay through the trophy lift. 5-star hotel, business-class flight, VIP-tier tickets. Limited availability.',
                    'base_price' => $this->priceFor($config, 'vip'),
                    'nights' => 5,
                    'flight_class' => 'business',
                    'accommodation_level' => '5_star',
                    'capacity' => 12,
                    'sold_count' => 11, // near sold out — flags the urgency UI
                    'is_featured' => true,
                    'included_match_ids' => array_slice($koIds, -3),
                    'included_venues' => $venuesFromMatches(array_slice($koIds, -3)),
                    'display_order' => 5,
                ],
                [
                    'name' => "{$short} Family Weekend",
                    'description' => 'A relaxed weekend built for families: two group-stage matches, 4-star hotel near the venue, and time to see the host city between games.',
                    'base_price' => $this->priceFor($config, 'family'),
                    'nights' => 4,
                    'flight_class' => 'economy',
                    'accommodation_level' => '4_star',
                    'capacity' => 30,
                    'sold_count' => 7,
                    'is_featured' => false,
                    'included_match_ids' => $familyIds,
                    'included_venues' => $venuesFromMatches($familyIds),
                    'display_order' => 30,
                ],
            ];

            foreach ($templates as $tpl) {
                Listing::create(array_merge($tpl, [
                    'tournament_id' => $id,
                    'type' => 'package',
                    'currency' => $currency,
                    'slug' => Str::slug($tpl['name']).'-'.Str::random(6),
                    'is_active' => $status !== 'concluded',
                ]));
            }

            $this->command->info("Seeded 4 packages for {$id} ({$short}).");
        }
    }

    /**
     * Very rough price tiering — good enough for demo data. Real prices
     * come from admin curation on the packages page.
     */
    private function priceFor(array $config, string $tier): int
    {
        $groupBase = (int) ($config['pricing']['ticket_prices']['Group Stage'] ?? 150);
        $accomBase = (int) ($config['pricing']['venue_tiers']['*']['hotel_3star'] ?? 150);
        // Rough total: ticket base + nightly stay + flight allowance.
        $base = ($groupBase * 3) + ($accomBase * 6) + 800;

        return match ($tier) {
            'explorer' => (int) round($base * 1.0),
            'family' => (int) round($base * 1.6),
            'superfan' => (int) round($base * 3.5),
            'vip' => (int) round($base * 5.0),
            default => $base,
        };
    }
}
