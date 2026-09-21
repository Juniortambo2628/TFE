<?php

namespace Database\Seeders;

use App\Models\PartnerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * DemoExtraPartnersSeeder — two more demo partners so the partners
 * directory and the upcoming-tournament "available listings" feed show a
 * wider spread of partner types:
 *
 *   - an AIRLINE   (Simba Air, partner_type=airline)
 *   - a BETTING co (GoalBet,  partner_type=sponsor)
 *
 * Same shape as DemoPartnerSeeder / DemoFinancePartnerSeeder. Idempotent.
 * Their offerings are seeded by DemoPartnerOfferingsSeeder.
 *
 * Credentials (dev only): airline@tfe.com / betting@tfe.com — both `password`.
 */
class DemoExtraPartnersSeeder extends Seeder
{
    public function run(): void
    {
        $this->makePartner([
            'email' => 'airline@tfe.com',
            'name' => 'Simba Air',
            'first_name' => 'Simba',
            'last_name' => 'Air',
            'partner_type' => 'airline',
            'services_offered' => ['Matchday flights', 'Fan group fares', 'Baggage + kit allowance', 'Multi-city routing'],
            'phone' => '+254711000000',
            'country' => 'Kenya',
            'company_name' => 'Simba Air Ltd.',
            'profile' => [
                'slug' => 'simba-air',
                'display_name' => 'Simba Air',
                'tagline' => 'Fly to the football. Fan fares across the continent.',
                'about' => 'Simba Air runs dedicated matchday routes into every host city — with fan group fares, generous kit allowance and flexible dates around the fixtures. Book flights alongside your tickets and stay on TFE.',
                'theme_accent' => '#dc2626',
                'stats' => [
                    ['label' => 'Destinations', 'value' => '40+'],
                    ['label' => 'On-time', 'value' => '94%'],
                    ['label' => 'Fan fares', 'value' => 'From $150'],
                    ['label' => 'Hubs', 'value' => '6'],
                ],
                'service_tags' => ['Matchday flights', 'Group fares', 'Flexible dates', 'Kit allowance', 'Multi-city'],
                'contact_email' => 'fanfares@simbaair.example',
                'website_url' => 'https://simbaair.example',
            ],
        ]);

        $this->makePartner([
            'email' => 'betting@tfe.com',
            'name' => 'GoalBet',
            'first_name' => 'Goal',
            'last_name' => 'Bet',
            'partner_type' => 'sponsor',
            'services_offered' => ['Matchday odds', 'Free-bet bundles', 'Acca boosts', 'Live in-play'],
            'phone' => '+254722000000',
            'country' => 'Kenya',
            'company_name' => 'GoalBet Ltd.',
            'profile' => [
                'slug' => 'goalbet',
                'display_name' => 'GoalBet',
                'tagline' => 'Back your team. Boosted odds for every matchday.',
                'about' => 'GoalBet is the official betting sponsor for fans on TFE — free-bet bundles for sign-ups, boosted accumulators on group-stage fixtures, and live in-play markets throughout the tournament. 18+, please gamble responsibly.',
                'theme_accent' => '#16a34a',
                'stats' => [
                    ['label' => 'Markets', 'value' => '200+'],
                    ['label' => 'Odds boosts', 'value' => 'Daily'],
                    ['label' => 'Payout', 'value' => 'Instant'],
                    ['label' => 'Welcome', 'value' => 'Free bet'],
                ],
                'service_tags' => ['Matchday odds', 'Free bets', 'Acca boosts', 'Live in-play', 'Responsible gaming'],
                'contact_email' => 'partners@goalbet.example',
                'website_url' => 'https://goalbet.example',
            ],
        ]);

        $this->command->info('Demo extra partners seeded: airline@tfe.com, betting@tfe.com (password: password).');
    }

    private function makePartner(array $data): void
    {
        $profile = $data['profile'];
        unset($data['profile']);

        $partner = User::firstOrCreate(
            ['email' => $data['email']],
            array_merge($data, [
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'is_admin' => false,
                'is_partner' => true,
                'verification_status' => 'verified',
            ]),
        );

        // Backfill flags on a pre-existing row.
        $partner->fill([
            'is_partner' => true,
            'partner_type' => $data['partner_type'],
            'verification_status' => 'verified',
        ])->save();

        PartnerProfile::firstOrCreate(
            ['user_id' => $partner->id],
            array_merge($profile, [
                'is_public' => true,
                'published_at' => now(),
            ]),
        );
    }
}
