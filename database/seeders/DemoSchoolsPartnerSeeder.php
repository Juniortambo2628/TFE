<?php

namespace Database\Seeders;

use App\Models\Listing;
use App\Models\PartnerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * DemoSchoolsPartnerSeeder — East Africa Schools Sports (school_community).
 *
 * The schools-and-communities archetype: the stakeholder that sits between
 * the platform and the next generation of fans, players and coaches. It is
 * the one partner type whose journey belongs to an INSTITUTION rather than
 * a fan — a school registers once and comes back season after season — so
 * its hub leads with programmes to join rather than a trip to buy.
 *
 * Its offerings are `Listing`s of the new `program` type: leagues,
 * festivals, coaching courses, grants and community projects. They ride the
 * existing publish → hub → AccentCard grid untouched, which is the point —
 * a new archetype needs new copy and new data, not a new page.
 *
 * Credentials (dev only): schools@tfe.com / password.
 */
class DemoSchoolsPartnerSeeder extends Seeder
{
    private const TOURNAMENT = 'afcon_2027';

    public function run(): void
    {
        $partner = User::firstOrCreate(
            ['email' => 'schools@tfe.com'],
            [
                'name' => 'East Africa Schools Sports',
                'first_name' => 'East Africa',
                'last_name' => 'Schools Sports',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'is_admin' => false,
                'is_partner' => true,
                'partner_type' => 'school_community',
                'verification_status' => 'verified',
                'services_offered' => ['School leagues', 'Coaching courses', 'Community projects', 'Sports grants'],
                'company_name' => 'East Africa Schools Sports Association',
            ]
        );

        PartnerProfile::updateOrCreate(
            ['user_id' => $partner->id],
            [
                'slug' => 'east-africa-schools-sports',
                'display_name' => 'East Africa Schools Sports',
                'tagline' => 'Develop talent. Build character. Transform communities.',
                'about' => 'East Africa Schools Sports connects schools, clubs and community groups across Kenya, Tanzania and Uganda to the programmes, competitions and resources that develop young talent. Every programme is run by verified coaches to published safeguarding standards, and participation is tracked so the impact on young people is measured rather than assumed.',
                'theme_accent' => '#15803d',
                'hero_image' => '/assets/img/backdrops/stadium-fans.jpg',
                'is_public' => true,
                'published_at' => now(),
                'stats' => [
                    ['label' => 'Schools registered', 'value' => '1,240'],
                    ['label' => 'Young people reached', 'value' => '86,000'],
                    ['label' => 'Coaches certified', 'value' => '2,100'],
                    ['label' => 'Countries', 'value' => 'KE · TZ · UG'],
                ],
                'service_tags' => [
                    'School leagues',
                    'Tournaments & festivals',
                    'Coach education',
                    'Learning resources',
                    'Community projects',
                    'Sports grants',
                ],
                'contact_email' => 'programmes@eassports.example',
                'website_url' => 'https://eassports.example',
            ]
        );

        $this->programs($partner);
    }

    /**
     * The programme catalogue.
     *
     * Published immediately (`approved` + active), exactly as
     * Partner\ListingController::store does since Sprint 42 — a seeded
     * partner should be in the state a real one reaches after saving, not
     * parked in a review queue that no longer applies to them.
     *
     * `base_price` of 0 is deliberate and meaningful here: a school league
     * or a grant is free to enter, and that is worth stating rather than
     * leaving null and rendering a blank where a price belongs.
     */
    private function programs(User $partner): void
    {
        $programs = [
            [
                'name' => 'AFCON Schools Cup',
                'description' => 'The regional schools championship. Qualifiers run in every county through the season, with the finals played as a curtain-raiser weekend at an AFCON 2027 host ground. Open to boys and girls teams at U15 and U17.',
                'price' => 0,
                'capacity' => 512,
                'sold' => 318,
                'featured' => true,
            ],
            [
                'name' => 'Girls in Sport Initiative',
                'description' => 'Equal access, in practice rather than in principle: dedicated leagues, kit support and female coaching staff for schools that have never fielded a girls team. Runs alongside the Schools Cup calendar.',
                'price' => 0,
                'capacity' => 240,
                'sold' => 186,
                'featured' => true,
            ],
            [
                'name' => 'Coaches Education Programme',
                'description' => 'A four-module certification for teachers and community coaches — session planning, age-appropriate training, safeguarding and first aid. Delivered in-person across the three host nations and online between blocks.',
                'price' => 45,
                'capacity' => 600,
                'sold' => 431,
                'featured' => false,
            ],
            [
                'name' => 'School Sports Grants',
                'description' => 'Equipment, pitch repair and travel grants for schools that cannot otherwise take part. Applications are reviewed termly; awards are published so the process is visible to everyone who applied.',
                'price' => 0,
                'capacity' => 150,
                'sold' => 94,
                'featured' => false,
            ],
            [
                'name' => 'Community Football Festivals',
                'description' => 'One-day festivals hosted with local clubs — small-sided tournaments, coaching taster sessions and a parents\' clinic. Designed so a community with no formal pitch can still host one.',
                'price' => 0,
                'capacity' => 80,
                'sold' => 52,
                'featured' => false,
            ],
            [
                'name' => 'Talent Pathway Showcase',
                'description' => 'Scouted trials connecting standout school players to academy and club pathways, with parents and guardians in the room for every conversation about a young player\'s future.',
                'price' => 0,
                'capacity' => 300,
                'sold' => 212,
                'featured' => false,
            ],
        ];

        foreach ($programs as $i => $p) {
            Listing::updateOrCreate(
                [
                    'publisher_type' => User::class,
                    'publisher_id' => $partner->id,
                    'name' => $p['name'],
                ],
                [
                    'slug' => Str::slug($p['name']),
                    'type' => 'program',
                    'tournament_id' => self::TOURNAMENT,
                    'description' => $p['description'],
                    'base_price' => $p['price'],
                    'currency' => 'USD',
                    'capacity' => $p['capacity'],
                    'sold_count' => $p['sold'],
                    'is_active' => true,
                    'is_featured' => $p['featured'],
                    'display_order' => $i,
                    'moderation_status' => 'approved',
                    'hero_image' => '/assets/img/backdrops/stadium-fans.jpg',
                ]
            );
        }

        $this->command?->info('Schools partner seeded: schools@tfe.com (password: password) + '.count($programs).' programmes.');
    }
}
