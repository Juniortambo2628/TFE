<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Budget;
use App\Models\Listing;
use App\Models\LoanApplication;
use App\Models\SavingsGoal;
use App\Models\Ticket;
use App\Models\TicketPurchase;
use App\Models\Tribe;
use App\Models\TribePost;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Fan-side demo activity — and, because every partner queue is fed by it,
 * the partner dashboards too.
 *
 * Before this the demo data was entirely partner-side: users, listings and
 * two ticket rows. Every fan table was empty, so the Budget Calculator had
 * no saved plans, Journey had no bookings, the tribes shipped in Sprint 48
 * were invisible, and — because a partner's Convert queue IS the budgets
 * whose fan picked one of their listings — every partner dashboard was an
 * empty state on a fresh install.
 *
 * Deliberately deterministic, like DemoAfconFixturesSeeder: fixed names,
 * amounts and dates rather than Faker, so a screenshot is reproducible and
 * two runs can be compared.
 *
 * Everything is idempotent, and everything routes through the model methods
 * that own denormalized counts — `Tribe::syncCounts()` via `addMember()`,
 * and the tier increment + `Ticket::syncTierTotals()` that the real purchase
 * flow uses. Writing `member_count` or `tickets.sold` directly here would
 * reintroduce precisely the bugs those methods exist to prevent.
 */
class DemoFanActivitySeeder extends Seeder
{
    private const TOURNAMENT = 'afcon_2027';

    /** The demo fan cohort. Varied nations so TeamAvatar rings differ. */
    private const FANS = [
        ['name' => 'Demo Fan', 'email' => 'fan@tfe.com', 'team' => 'Kenya'],
        ['name' => 'Amina Otieno', 'email' => 'amina@tfe.com', 'team' => 'Kenya'],
        ['name' => 'Joseph Mwangi', 'email' => 'joseph@tfe.com', 'team' => 'Kenya'],
        ['name' => 'Fatima Ndiaye', 'email' => 'fatima@tfe.com', 'team' => 'Senegal'],
        ['name' => 'Tunde Adeyemi', 'email' => 'tunde@tfe.com', 'team' => 'Nigeria'],
        ['name' => 'Grace Mushi', 'email' => 'grace@tfe.com', 'team' => 'Tanzania'],
        ['name' => 'Samir Haddad', 'email' => 'samir@tfe.com', 'team' => 'Morocco'],
    ];

    public function run(): void
    {
        $fans = $this->fans();

        $this->budgets($fans);
        $this->bookings($fans);
        $this->savingsGoals($fans);
        $this->loanApplications($fans);
        $this->ticketPurchases($fans);
        $this->tribes($fans);

        $this->command?->info('Demo fan activity seeded for '.count($fans).' fans.');
    }

    /** @return array<string, User> keyed by email */
    private function fans(): array
    {
        $out = [];
        foreach (self::FANS as $spec) {
            $out[$spec['email']] = User::firstOrCreate(
                ['email' => $spec['email']],
                [
                    'name' => $spec['name'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'is_partner' => false,
                    'team_support' => $spec['team'],
                ],
            );
        }

        return $out;
    }

    /**
     * Saved travel briefs.
     *
     * `listing_id` is what puts a budget in a partner's Convert queue, so
     * these are spread across the travel agent's and airline's AFCON
     * listings — a budget with no listing would be invisible to every
     * partner, which is the state the platform was already in.
     *
     * Mixed `partner_status` so the queue shows all three states, and mixed
     * currencies so the multicurrency rendering is exercised rather than
     * assumed.
     */
    private function budgets(array $fans): void
    {
        $listings = $this->listingsByPartner(['travel_agent', 'airline']);
        if (empty($listings)) {
            $this->command?->warn('No partner listings for '.self::TOURNAMENT.' — budgets will not reach any Convert queue.');
        }

        $specs = [
            ['fan@tfe.com', 'Nairobi group stage — 3 matches', 4250, 'USD', 7, 'pending', 'standard', 'economy'],
            ['amina@tfe.com', 'Kenya every home game', 6900, 'KES', 12, 'approved', 'luxury', 'business'],
            ['joseph@tfe.com', 'Kasarani double-header', 1850, 'USD', 4, 'pending', 'budget', 'economy'],
            ['fatima@tfe.com', 'Senegal — follow the Lions', 8400, 'EUR', 16, 'modified', 'luxury', 'business'],
            ['tunde@tfe.com', 'Nigeria to the final', 11200, 'USD', 21, 'approved', 'luxury', 'business'],
            ['grace@tfe.com', 'Dar es Salaam weekender', 1400, 'USD', 3, 'pending', 'budget', 'economy'],
            ['samir@tfe.com', 'Morocco group stage', 5100, 'USD', 9, 'pending', 'standard', 'economy'],
            ['fan@tfe.com', 'Semi-final + final package', 7300, 'USD', 8, 'approved', 'luxury', 'business'],
        ];

        foreach ($specs as $i => [$email, $name, $cost, $currency, $nights, $status, $accom, $flight]) {
            if (! isset($fans[$email])) {
                continue;
            }

            Budget::updateOrCreate(
                ['user_id' => $fans[$email]->id, 'name' => $name],
                [
                    'tournament_id' => self::TOURNAMENT,
                    'listing_id' => $listings ? $listings[$i % count($listings)] : null,
                    'total_cost' => $cost,
                    'currency' => $currency,
                    'match_ids' => [],
                    'accommodation_level' => $accom,
                    'flight_class' => $flight,
                    'nights' => $nights,
                    'is_active' => true,
                    'partner_status' => $status,
                    'partner_cost' => $status === 'modified' ? $cost * 0.92 : null,
                    'partner_notes' => $status === 'modified'
                        ? 'Swapped to a closer hotel and re-quoted the internal flights.'
                        : null,
                    'breakdown' => [
                        'tickets' => round($cost * 0.28),
                        'flights' => round($cost * 0.34),
                        'accommodation' => round($cost * 0.26),
                        'transport' => round($cost * 0.07),
                        'food' => round($cost * 0.05),
                    ],
                ],
            );
        }
    }

    /** Confirmed trips, so Fan/Journey renders rows instead of an empty state. */
    private function bookings(array $fans): void
    {
        $specs = [
            ['amina@tfe.com', 'Kenya every home game', 'package', 'confirmed', 6900, 6900, 'KES'],
            ['tunde@tfe.com', 'Nigeria to the final', 'package', 'confirmed', 11200, 5600, 'USD'],
            ['fatima@tfe.com', 'Senegal — follow the Lions', 'tour', 'pending', 8400, 0, 'EUR'],
            ['fan@tfe.com', 'Semi-final + final package', 'package', 'confirmed', 7300, 7300, 'USD'],
        ];

        foreach ($specs as [$email, $pkg, $type, $status, $total, $paid, $currency]) {
            if (! isset($fans[$email])) {
                continue;
            }

            Booking::updateOrCreate(
                ['user_id' => $fans[$email]->id, 'package_name' => $pkg],
                [
                    'tournament_id' => self::TOURNAMENT,
                    'package_type' => $type,
                    'status' => $status,
                    'total_amount' => $total,
                    'amount_paid' => $paid,
                    'currency' => $currency,
                    'booking_date' => now()->subDays(12),
                    'matches' => [],
                ],
            );
        }
    }

    /** Part-funded goals — a goal at 0% or 100% shows none of the UI. */
    private function savingsGoals(array $fans): void
    {
        $specs = [
            ['fan@tfe.com', 'AFCON 2027 trip fund', 4250, 1700, 'USD'],
            ['joseph@tfe.com', 'Kasarani tickets', 1850, 1200, 'USD'],
            ['grace@tfe.com', 'Dar weekender', 1400, 340, 'USD'],
            ['samir@tfe.com', 'Morocco group stage', 5100, 3825, 'USD'],
        ];

        foreach ($specs as [$email, $name, $target, $current, $currency]) {
            if (! isset($fans[$email])) {
                continue;
            }

            SavingsGoal::updateOrCreate(
                ['user_id' => $fans[$email]->id, 'name' => $name],
                [
                    'target_amount' => $target,
                    'current_amount' => $current,
                    'currency' => $currency,
                    'target_date' => '2026-12-01',
                    'status' => 'active',
                    'budget_id' => Budget::where('user_id', $fans[$email]->id)->value('id'),
                ],
            );
        }
    }

    /** Routed to the seeded finance partner, so its queue has all states. */
    private function loanApplications(array $fans): void
    {
        $financePartner = User::where('partner_type', 'finance_partner')->first();
        if (! $financePartner) {
            $this->command?->warn('No finance partner — skipping loan applications.');

            return;
        }

        // UPPERCASE deliberately: LoanApplicationController writes 'PENDING'
        // and LoanReviewController validates in:APPROVED,REJECTED,DISBURSED,
        // so the partner dashboard counts uppercase. Seeding lowercase gives
        // a queue with rows and tiles that all read zero.
        $specs = [
            ['fan@tfe.com', 4250, 'PENDING', null],
            ['joseph@tfe.com', 1850, 'PENDING', null],
            ['tunde@tfe.com', 11200, 'APPROVED', 14.5],
            ['fatima@tfe.com', 8400, 'REJECTED', null],
            ['samir@tfe.com', 5100, 'PENDING', null],
        ];

        foreach ($specs as [$email, $amount, $status, $rate]) {
            if (! isset($fans[$email])) {
                continue;
            }

            $budget = Budget::where('user_id', $fans[$email]->id)->first();

            LoanApplication::updateOrCreate(
                ['user_id' => $fans[$email]->id, 'amount' => $amount],
                [
                    'budget_id' => $budget?->id,
                    'finance_partner_id' => $financePartner->id,
                    'purpose' => 'AFCON 2027 travel and match tickets',
                    'status' => $status,
                    'interest_rate' => $rate,
                    'notes' => $status === 'REJECTED'
                        ? 'Requested amount exceeds the unsecured limit for a first application.'
                        : null,
                ],
            );
        }
    }

    /**
     * Ticket sales through TFE.
     *
     * These mirror the real purchase flow exactly: bump the TIER's `sold`,
     * then let `Ticket::syncTierTotals()` derive the parent totals. Writing
     * `tickets.sold` here would be the bug that method exists to prevent.
     *
     * Note `seats_sold` (these purchases) and `sellthrough` (the tiers' own
     * `sold`, which covers every sales channel) are different measures by
     * design — see `Partner\TicketController::statsFor`.
     */
    private function ticketPurchases(array $fans): void
    {
        $tickets = Ticket::with('tiers')->get();
        if ($tickets->isEmpty()) {
            $this->command?->warn('No tickets — skipping purchases.');

            return;
        }

        $buyers = array_values($fans);
        $order = 0;

        foreach ($tickets as $ticket) {
            foreach ($ticket->tiers as $tier) {
                // Two orders per tier, so every tier of the bowl has sales
                // behind it and the seat map's occupancy is real per ring.
                foreach ([2, 3] as $qty) {
                    $buyer = $buyers[$order % count($buyers)];
                    $reference = sprintf('TFE-DEMO-%03d', $order + 1);
                    $order++;

                    $existing = TicketPurchase::where('reference', $reference)->first();
                    if ($existing) {
                        continue;
                    }

                    TicketPurchase::create([
                        'user_id' => $buyer->id,
                        'ticket_id' => $ticket->id,
                        'ticket_tier_id' => $tier->id,
                        'tier_name' => $tier->name,
                        'quantity' => $qty,
                        'unit_price' => $tier->price,
                        'total' => round($tier->price * $qty, 2),
                        'currency' => $ticket->currency ?? 'USD',
                        'reference' => $reference,
                        'status' => 'paid',
                        'paid_with' => 'card',
                    ]);

                    $tier->increment('sold', $qty);
                }
            }

            $ticket->syncTierTotals();
        }
    }

    /**
     * Fan communities across all three privacy modes, so the Sprint 48
     * privacy work is visible rather than theoretical: a signed-in fan can
     * see a public tribe, meet the request gate on a private one, and hit
     * Fan/TribeLocked on the invite-only one.
     */
    private function tribes(array $fans): void
    {
        $specs = [
            [
                'name' => 'Harambee Stars Travellers',
                'privacy' => 'public',
                'owner' => 'amina@tfe.com',
                'description' => 'Kenyan fans coordinating transport, stays and tickets around every Harambee Stars fixture.',
                'members' => ['fan@tfe.com', 'joseph@tfe.com', 'grace@tfe.com'],
                'posts' => [
                    ['Kasarani matchday transport', 'Matatu routes get packed three hours before kick-off. Anyone up for splitting a van from Westlands?'],
                    ['Where are we watching the opener?', 'Booking a table at a sports bar in town if the Raila Odinga tickets sell out. Drop your numbers.'],
                ],
            ],
            [
                'name' => 'Taifa Stars Supporters',
                'privacy' => 'public',
                'owner' => 'grace@tfe.com',
                'description' => 'Tanzania supporters — Dar es Salaam, Arusha, Dodoma and Zanzibar meetups.',
                'members' => ['fan@tfe.com', 'amina@tfe.com'],
                'posts' => [
                    ['Ferry to Amaan Stadium', 'The Zanzibar fixture needs an early ferry. Posting the timetable once the schedule firms up.'],
                ],
            ],
            [
                'name' => 'Budget Travellers Collective',
                'privacy' => 'private',
                'owner' => 'joseph@tfe.com',
                'description' => 'Sharing the cheapest routes, hostels and group-buy tickets. Approval required so it stays useful.',
                'members' => ['fan@tfe.com', 'samir@tfe.com'],
                'posts' => [
                    ['Group-buy on Upper tier seats', 'Upper is 0.6x the base price. Twenty of us together and the coach becomes worth it.'],
                ],
            ],
            [
                'name' => 'Final Weekend VIP',
                'privacy' => 'invite_only',
                'owner' => 'tunde@tfe.com',
                'description' => 'Coordinating hospitality for the semi-finals and the final in Nairobi.',
                'members' => ['fatima@tfe.com'],
                'posts' => [
                    ['Hospitality block confirmed', 'VIP tier at the Raila Odinga ground is held for our group until the semi-final draw.'],
                ],
            ],
        ];

        foreach ($specs as $spec) {
            $owner = $fans[$spec['owner']] ?? null;
            if (! $owner) {
                continue;
            }

            $tribe = Tribe::updateOrCreate(
                ['slug' => Str::slug($spec['name'])],
                [
                    'name' => $spec['name'],
                    'description' => $spec['description'],
                    'created_by' => $owner->id,
                    'privacy' => $spec['privacy'],
                    'forum_enabled' => true,
                    'tournament_id' => self::TOURNAMENT,
                ],
            );

            // addMember() goes through syncCounts(); never touch the count
            // columns directly.
            $tribe->addMember($owner, 'admin');
            foreach ($spec['members'] as $email) {
                if (isset($fans[$email])) {
                    $tribe->addMember($fans[$email]);
                }
            }

            foreach ($spec['posts'] as $i => [$title, $content]) {
                TribePost::updateOrCreate(
                    ['tribe_id' => $tribe->id, 'title' => $title],
                    [
                        'user_id' => $i === 0 ? $owner->id : ($fans[$spec['members'][0]] ?? $owner)->id,
                        'content' => $content,
                        'is_pinned' => $i === 0,
                        'view_count' => 0,
                    ],
                );
            }

            $tribe->syncCounts();
        }
    }

    /** @return array<int> listing ids belonging to the given partner types */
    private function listingsByPartner(array $partnerTypes): array
    {
        $partnerIds = User::whereIn('partner_type', $partnerTypes)->pluck('id');

        return Listing::where('publisher_type', User::class)
            ->whereIn('publisher_id', $partnerIds)
            ->where('tournament_id', self::TOURNAMENT)
            ->pluck('id')
            ->all();
    }
}
