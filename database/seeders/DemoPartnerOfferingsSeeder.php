<?php

namespace Database\Seeders;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * DemoPartnerOfferingsSeeder — placeholder offerings published by each demo
 * partner (travel / finance / airline / betting), so the "Plan your trip"
 * feed at the bottom of every UPCOMING tournament page
 * (/tournaments/{slug}) shows a real spread of available partner listings.
 *
 * Offerings are partner-authored (publisher = the partner user), approved +
 * active, and scoped to every non-concluded tournament in config. Idempotent
 * — keyed on a deterministic slug per partner+offering+tournament.
 *
 * Runs after DemoPartnerSeeder / DemoFinancePartnerSeeder /
 * DemoExtraPartnersSeeder so the partner users exist.
 */
class DemoPartnerOfferingsSeeder extends Seeder
{
    /** email => [offerings…] */
    private array $catalogue = [
        'partner@tfe.com' => [
            ['name' => 'Matchday Transfers & Local Guide', 'type' => 'tour', 'price' => 120, 'cap' => 120, 'sold' => 41, 'img' => 'assets/img/backdrops/stadium-fans.jpg', 'desc' => 'Airport-to-stadium transfers and an in-country guide for every fixture on your itinerary.'],
            ['name' => 'Hotel + Tickets Bundle', 'type' => 'package', 'price' => 680, 'cap' => 60, 'sold' => 22, 'img' => 'assets/img/IMG-15.jpg', 'desc' => '4-star stays near the venue paired with verified group-stage tickets — one price, one plan.'],
        ],
        'finance@tfe.com' => [
            ['name' => 'Trip Financing — 12 months', 'type' => 'offer', 'price' => 99, 'cap' => 500, 'sold' => 180, 'img' => 'assets/img/IMG-12.jpg', 'desc' => 'Spread your whole trip across 12 monthly instalments. Representative from $99/month, decision in ~48h.'],
            ['name' => 'Community Savings Plan', 'type' => 'offer', 'price' => 50, 'cap' => 400, 'sold' => 96, 'img' => 'assets/img/backdrops/nigeria-fans.jpg', 'desc' => 'Save toward matchday as a group and unlock a booking bonus when your tribe hits its target.'],
        ],
        'airline@tfe.com' => [
            ['name' => 'Fan Fare — Nairobi hub', 'type' => 'offer', 'price' => 260, 'cap' => 300, 'sold' => 128, 'img' => 'assets/img/backdrops/plane-square.jpg', 'desc' => 'Return economy fan fares into the host cities from the Nairobi hub, with flexible matchday dates.'],
            ['name' => 'Business-class Matchday Flights', 'type' => 'offer', 'price' => 1450, 'cap' => 40, 'sold' => 12, 'img' => 'assets/img/backdrops/field-night.jpg', 'desc' => 'Lie-flat business class timed around kick-off, with extra kit + baggage allowance for supporters.'],
        ],
        'betting@tfe.com' => [
            ['name' => 'Welcome Free Bet Bundle', 'type' => 'offer', 'price' => 25, 'cap' => 1000, 'sold' => 420, 'img' => 'assets/img/backdrops/argentina-fans.jpg', 'desc' => 'Sign up and claim a $25 free-bet bundle for the group stage. 18+, gamble responsibly.'],
            ['name' => 'Group-Stage Odds Boost', 'type' => 'offer', 'price' => 10, 'cap' => 800, 'sold' => 260, 'img' => 'assets/img/backdrops/brazil-fan-landscape.jpg', 'desc' => 'Boosted accumulators on every group-stage fixture from a $10 stake. 18+, gamble responsibly.'],
        ],
    ];

    public function run(): void
    {
        // Only upcoming/ongoing tournaments feature offerings on their page.
        $tournaments = collect(config('tournaments.tournaments', []))
            ->reject(fn ($t) => ($t['status'] ?? 'upcoming') === 'concluded');

        $count = 0;
        foreach ($this->catalogue as $email => $offerings) {
            $partner = User::where('email', $email)->first();
            if (! $partner) {
                continue;
            }

            foreach ($tournaments as $id => $config) {
                $currency = $config['pricing']['currency'] ?? 'USD';
                $order = 50;
                foreach ($offerings as $o) {
                    $slug = Str::slug($partner->id.'-'.$id.'-'.$o['name']);
                    Listing::firstOrCreate(
                        ['slug' => $slug],
                        [
                            'tournament_id' => $id,
                            'type' => $o['type'],
                            'name' => $o['name'],
                            'description' => $o['desc'],
                            'hero_image' => $o['img'] ?? null,
                            'base_price' => $o['price'],
                            'currency' => $currency,
                            'capacity' => $o['cap'],
                            'sold_count' => $o['sold'],
                            'is_active' => true,
                            'is_featured' => false,
                            'display_order' => $order,
                            'moderation_status' => 'approved',
                            'publisher_type' => User::class,
                            'publisher_id' => $partner->id,
                        ],
                    );
                    $order += 5;
                    $count++;
                }
            }
        }

        $this->command->info("Seeded partner offerings across upcoming tournaments ({$count} rows ensured).");
    }
}
