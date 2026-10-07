<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make(DemoCredentials::password()),
                'email_verified_at' => now(),
            ]
        );

        $this->call([
            AdminUserSeeder::class,
            WorldCupSeeder::class,
            PackageSeeder::class,
            DemoPartnerSeeder::class,
            DemoFinancePartnerSeeder::class,
            DemoExtraPartnersSeeder::class,
            DemoTicketingPartnerSeeder::class,
            DemoPartnerOfferingsSeeder::class,
            DemoSchoolsPartnerSeeder::class,
            DemoLearningResourcesSeeder::class,

            // Order matters below. Fixtures first — the default tournament
            // is afcon_2027 and had none, since every seeded fixture
            // belonged to the concluded wc_2026. Fan activity last: it
            // reads the partner listings seeded above to put budgets in the
            // right Convert queues.
            DemoAfconFixturesSeeder::class,
            DemoFanActivitySeeder::class,
        ]);
    }
}
