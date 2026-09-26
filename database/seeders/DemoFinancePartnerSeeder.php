<?php

namespace Database\Seeders;

use App\Models\PartnerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * DemoFinancePartnerSeeder — Sprint 14 companion to DemoPartnerSeeder.
 *
 * Creates a verified finance-partner (Ecobank-styled) with a published
 * /partners/ecobank-fan-finance hub so the finance archetype has real
 * state on both the fan side (finance CTA on the calculator) and the
 * partner dashboard variant.
 *
 * Idempotent — safe to re-run.
 *
 * Credentials (dev only):
 *   Finance : finance@tfe.com / password
 */
class DemoFinancePartnerSeeder extends Seeder
{
    public function run(): void
    {
        $partner = User::firstOrCreate(
            ['email' => 'finance@tfe.com'],
            [
                'name' => 'Ecobank Fan Finance',
                'first_name' => 'Ecobank',
                'last_name' => 'Fan Finance',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'is_admin' => false,
                'is_partner' => true,
                'partner_type' => 'finance_partner',
                'verification_status' => 'verified',
                'services_offered' => [
                    'Matchday trip loans',
                    'Instalment plans',
                    'Group booking finance',
                    'FX-friendly disbursement',
                ],
                'company_name' => 'Ecobank Transnational Inc.',
            ],
        );

        // Backfill flags for any pre-existing row.
        $partner->fill([
            'is_partner' => true,
            'partner_type' => 'finance_partner',
            'verification_status' => 'verified',
        ])->save();

        PartnerProfile::firstOrCreate(
            ['user_id' => $partner->id],
            [
                'slug' => 'ecobank-fan-finance',
                'display_name' => 'Ecobank Fan Finance',
                'tagline' => 'Pay for the trip today. Watch the match tomorrow.',
                'about' => 'Ecobank Fan Finance underwrites tournament trips across the continent — from AFCON group-stage weekends to full World Cup runs. Apply against your budget on TFE and receive an underwriting decision typically within 48 hours, disbursed in the local currency of your destination.',
                'theme_accent' => '#0072CE',
                'stats' => [
                    ['label' => 'Countries', 'value' => '33'],
                    ['label' => 'Avg decision', 'value' => '48h'],
                    ['label' => 'Loans disbursed', 'value' => 'USD 12M+'],
                    ['label' => 'Approval rate', 'value' => '76%'],
                ],
                'service_tags' => [
                    'Trip financing',
                    'Instalment plans',
                    'FX disbursement',
                    'Group loans',
                    'Fast underwriting',
                ],
                'contact_email' => 'fanfinance@ecobank.example',
                'website_url' => 'https://ecobank.example',
                'is_public' => true,
                'published_at' => now(),
            ],
        );

        $this->command->info('Demo finance partner seeded: finance@tfe.com / password');
        $this->command->info('Public hub: /partners/ecobank-fan-finance');
    }
}
