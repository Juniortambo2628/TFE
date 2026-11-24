<?php

namespace Database\Seeders;

use App\Models\PartnerProfile;
use App\Models\Ticket;
use App\Models\TicketBox;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * DemoTicketingPartnerSeeder — MatchDay Africa (ticketing_partner).
 *
 * Adds one more partner archetype: the official ticket vendor. Same shape
 * as the other demo partners. Two ticket rows are seeded on AFCON 2027
 * using the local stadium catalogue + AFCON participating teams, with
 * partial `sold` counts so the "X% sold" bar reads correctly.
 *
 * Credentials (dev only): ticketing@tfe.com / password.
 */
class DemoTicketingPartnerSeeder extends Seeder
{
    /**
     * How much fuller than its tier's average each stand sells. The main
     * (West) stand on the halfway line goes first, corners last.
     */
    private const STAND_DEMAND = [
        'west' => 1.12,
        'east' => 1.0,
        'north' => 0.92,
        'south' => 0.92,
        'north_west' => 0.8,
        'south_west' => 0.8,
        'north_east' => 0.8,
        'south_east' => 0.8,
    ];

    public function run(): void
    {
        $partner = User::firstOrCreate(
            ['email' => 'ticketing@tfe.com'],
            [
                'name' => 'MatchDay Africa',
                'first_name' => 'MatchDay',
                'last_name' => 'Africa',
                'password' => Hash::make(DemoCredentials::password()),
                'email_verified_at' => now(),
                'is_admin' => false,
                'is_partner' => true,
                'partner_type' => 'ticketing_partner',
                'verification_status' => 'verified',
                'services_offered' => ['Verified matchday tickets', 'Group bookings', 'Fan-zone bundles', 'e-Ticket delivery'],
                'company_name' => 'MatchDay Africa Ltd.',
            ]
        );

        PartnerProfile::updateOrCreate(
            ['user_id' => $partner->id],
            [
                'slug' => 'matchday-africa',
                'display_name' => 'MatchDay Africa',
                'tagline' => 'The official matchday ticket partner.',
                'about' => 'MatchDay Africa is the official ticketing partner for fans on TFE. Every seat is verified, delivered as an e-Ticket to your wallet, and backed by a matchday guarantee. Group and fan-zone bundles available for every fixture.',
                'theme_accent' => '#8b5cf6',
                'hero_image' => '/assets/img/backdrops/stadium-fans.jpg',
                'is_public' => true,
                'published_at' => now(),
                'stats' => [
                    ['label' => 'Verified seats', 'value' => '100%'],
                    ['label' => 'Delivery', 'value' => 'Instant e-Ticket'],
                    ['label' => 'Fixtures', 'value' => 'Every match'],
                    ['label' => 'Support', 'value' => '24/7 matchday'],
                ],
                'service_tags' => ['Verified tickets', 'Group bookings', 'Fan-zone bundles', 'e-Tickets', 'Matchday guarantee'],
                'contact_email' => 'support@matchdayafrica.example',
                'website_url' => 'https://matchdayafrica.example',
            ]
        );

        // Two ticket rows on AFCON 2027 (idempotent — a stable key of
        // partner_id + venue + kickoff would need a unique index; we
        // use `firstOrCreate` on venue+kickoff which is enough here).
        $fixtures = [
            [
                'home_team' => 'Kenya', 'home_team_code' => 'ke',
                'away_team' => 'Nigeria', 'away_team_code' => 'ng',
                // Must match the catalogue key in config/stadiums.php. It
                // used to read `moi-international-sports-centre`, which is not
                // a key there, so a slug-based join found nothing.
                'venue_slug' => 'moi-kasarani',
                'venue_name' => 'Moi International Sports Centre, Kasarani',
                'venue_city' => 'Nairobi', 'venue_country' => 'Kenya',
                'venue_capacity' => 48000,
                'stage' => 'Group Stage',
                'kickoff_at' => '2027-01-18 19:00:00',
                'price' => 60,
                'capacity' => 40000,
                // Per-tier occupancy. The parent `sold` is DERIVED from these
                // by Ticket::syncTierTotals() below, so the bowl, the tier
                // picker and the sell-through bar can never disagree.
                'tier_sold_pct' => ['vip' => 0.88, 'premium' => 0.81, 'standard' => 0.72, 'upper' => 0.61],
                // Hospitality boxes already gone through other channels.
                'booked_boxes' => ['3', '6', '7', '10'],
                'hero_image' => 'stadiums/AFCON/moi-kasarani_hero.webp',
            ],
            [
                'home_team' => 'Tanzania', 'home_team_code' => 'tz',
                'away_team' => 'Morocco', 'away_team_code' => 'ma',
                'venue_slug' => 'benjamin-mkapa',
                'venue_name' => 'Benjamin Mkapa Stadium',
                'venue_city' => 'Dar es Salaam', 'venue_country' => 'Tanzania',
                'venue_capacity' => 60000,
                'stage' => 'Group Stage',
                'kickoff_at' => '2027-01-20 21:00:00',
                'price' => 60,
                'capacity' => 50000,
                'tier_sold_pct' => ['vip' => 0.62, 'premium' => 0.48, 'standard' => 0.38, 'upper' => 0.29],
                'booked_boxes' => ['6'],
                'hero_image' => 'stadiums/AFCON/benjamin-mkapa_hero.webp',
            ],
        ];

        foreach ($fixtures as $row) {
            $tierShares = $row['tier_sold_pct'];
            $bookedBoxes = $row['booked_boxes'] ?? [];
            unset($row['tier_sold_pct'], $row['booked_boxes']);

            $ticket = Ticket::firstOrCreate(
                [
                    'partner_id' => $partner->id,
                    'venue_slug' => $row['venue_slug'],
                    'kickoff_at' => $row['kickoff_at'],
                ],
                array_merge($row, [
                    'tournament_id' => 'afcon_2027',
                    'currency' => 'USD',
                    'sold' => 0,
                    'is_active' => true,
                ])
            );

            // Idempotent: does nothing once this fixture has tiers, so
            // re-seeding never clobbers prices someone has since edited.
            $ticket->seedDefaultTiers();
            // Tiers created before blocks existed get them here.
            $ticket->seedDefaultBlocks();

            foreach ($ticket->tiers()->with('blocks')->get() as $tier) {
                // Simulated sales from other channels, written ONCE: only a
                // tier none of whose blocks has sold a seat. Resetting them on
                // every run (as this used to, per tier) wiped the seats the
                // fan activity seeder and real buyers had added since.
                if ($tier->blocks->sum('sold') > 0) {
                    continue;
                }

                $pct = $tierShares[$tier->key] ?? 0;

                foreach ($tier->blocks as $block) {
                    // Fixed per stand, so the map has a real shape to it: the
                    // main stand fills first, the corners last. No Faker.
                    $factor = self::STAND_DEMAND[$block->stand] ?? 1.0;
                    $block->update(['sold' => min($block->capacity, (int) round($block->capacity * min(1, $pct * $factor)))]);
                }

                $tier->syncBlockTotals();
            }

            $ticket->syncTierTotals();

            $this->seedBoxes($ticket, $bookedBoxes);
        }

        $this->command->info('Demo ticketing partner seeded: ticketing@tfe.com (password: password) + 2 tickets, 4 tiers of 32 blocks each.');
    }

    /**
     * Twelve hospitality boxes along the main stand. The two on the halfway
     * line seat 12, the rest 8. Priced as the PARTNER would set them (demo
     * data, like the fixture's own `price`): the box's seats at 1.5x the VIP
     * seat price, to the nearest 10.
     *
     * Idempotent: a box is created once and never re-priced, and the boxes
     * listed as booked elsewhere are marked so only if nobody has booked
     * them yet.
     */
    private function seedBoxes(Ticket $ticket, array $booked): void
    {
        $vip = (float) ($ticket->tiers()->where('key', 'vip')->value('price') ?? $ticket->price * 4);

        for ($i = 1; $i <= 12; $i++) {
            $seats = in_array($i, [6, 7], true) ? 12 : 8;

            $box = TicketBox::firstOrCreate(
                ['ticket_id' => $ticket->id, 'code' => (string) $i],
                [
                    'name' => 'Skybox '.$i,
                    'seats' => $seats,
                    'price' => round($vip * $seats * 1.5 / 10) * 10,
                    'sort_order' => $i,
                ],
            );

            if (in_array((string) $i, $booked, true) && ! $box->isBooked()) {
                $box->update(['booked_at' => now()]);
            }
        }
    }
}
