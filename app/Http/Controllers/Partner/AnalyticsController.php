<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\Listing;
use App\Models\LoanApplication;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Measure tab — per-partner analytics. Same tile shape as the admin
 * analytics page (MetricTile primitive) but every metric is scoped to
 * the logged-in partner: their listings, their budget queue, their
 * revenue. Partners who haven't published a listing yet see the same
 * page against an empty set with an explicit "publish your first listing"
 * empty state.
 */
class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->partner_type === 'finance_partner') {
            return $this->indexFinance($user);
        }

        $listings = Listing::query()
            ->publishedBy(User::class, $user->id)
            ->get();

        $listingIds = $listings->pluck('id')->all();

        // Budgets whose fan picked one of this partner's listings.
        $budgets = ! empty($listingIds)
            ? Budget::whereIn('listing_id', $listingIds)->get()
            : collect();

        $approved = $budgets->where('partner_status', 'approved');
        $pending = $budgets->whereIn('partner_status', ['pending', 'modified']);

        // Turnaround: hours from budget created_at → updated_at for
        // approved rows. Rough but honest — a real quote-timestamp column
        // is a future refinement.
        $turnaroundHours = $approved
            ->map(fn ($b) => optional($b->updated_at)->diffInHours($b->created_at))
            ->filter()
            ->avg();

        // Revenue by currency (matches admin analytics shape). Partner
        // rows are all in the tournament's currency, so this collapses
        // to one entry in practice but the map keeps future-proofness.
        $revenueByCurrency = [];
        foreach ($approved as $b) {
            $currency = 'USD'; // Budgets don't carry currency yet — assume USD.
            $revenueByCurrency[$currency] = ($revenueByCurrency[$currency] ?? 0) + (float) $b->partner_cost;
        }

        $tiles = [
            [
                'label' => 'Listings Published',
                'value' => $listings->where('moderation_status', 'approved')->count(),
                'sub' => $listings->count().' total (drafts + pending)',
                'accent' => 'blue',
                'icon' => 'fa-tags',
            ],
            [
                'label' => 'Budgets in Queue',
                'value' => $pending->count(),
                'sub' => $approved->count().' approved • '.$budgets->where('partner_status', 'rejected')->count().' rejected',
                'accent' => 'amber',
                'icon' => 'fa-inbox',
            ],
            [
                'label' => 'Total Revenue',
                'value' => empty($revenueByCurrency) ? '$0' : '$'.number_format((int) array_sum($revenueByCurrency)),
                'sub' => 'From approved quotes',
                'accent' => 'green',
                'icon' => 'fa-coins',
            ],
            [
                'label' => 'Avg Turnaround',
                'value' => $turnaroundHours ? round($turnaroundHours).'h' : '—',
                'sub' => 'From brief to quote',
                'accent' => 'purple',
                'icon' => 'fa-stopwatch',
            ],
            [
                'label' => 'Seats Sold',
                'value' => (int) $listings->sum('sold_count'),
                'sub' => 'Across all listings',
                'accent' => 'blue',
                'icon' => 'fa-chair',
            ],
            [
                'label' => 'Sell-through %',
                'value' => $this->sellThrough($listings).'%',
                'sub' => 'Sold / capacity',
                'accent' => 'green',
                'icon' => 'fa-chart-line',
            ],
        ];

        return Inertia::render('Partner/Analytics', [
            'tiles' => $tiles,
            'has_listings' => ! empty($listingIds),
        ]);
    }

    /**
     * Finance-partner Measure tab: loan volume, approval rate, avg
     * disbursement, avg interest. Reads the same tile shape so the page
     * component doesn't need a separate branch.
     */
    protected function indexFinance(User $user): Response
    {
        $base = LoanApplication::query()->forPartner($user->id);
        $total = (clone $base)->count();
        $approved = (clone $base)->where('status', 'APPROVED');
        $approvedCount = (clone $approved)->count();
        $disbursed = (clone $approved)->sum('amount');
        $avgRate = (clone $approved)->avg('interest_rate');
        $avgAmount = (clone $approved)->avg('amount');
        $approvalPct = $total > 0 ? (int) round(($approvedCount / $total) * 100) : 0;

        $tiles = [
            [
                'label' => 'Applications',
                'value' => $total,
                'sub' => $approvedCount.' approved',
                'accent' => 'blue',
                'icon' => 'fa-file-invoice-dollar',
            ],
            [
                'label' => 'Total Disbursed',
                'value' => '$'.number_format((float) $disbursed),
                'sub' => 'Across approved loans',
                'accent' => 'green',
                'icon' => 'fa-coins',
            ],
            [
                'label' => 'Approval Rate',
                'value' => $approvalPct.'%',
                'sub' => 'Approved / total',
                'accent' => 'amber',
                'icon' => 'fa-check-circle',
            ],
            [
                'label' => 'Avg Loan Size',
                'value' => $avgAmount ? '$'.number_format((float) $avgAmount) : '—',
                'sub' => 'Per approved application',
                'accent' => 'purple',
                'icon' => 'fa-hand-holding-usd',
            ],
            [
                'label' => 'Avg Interest',
                'value' => $avgRate ? number_format((float) $avgRate, 2).'%' : '—',
                'sub' => 'Weighted across loans',
                'accent' => 'blue',
                'icon' => 'fa-percent',
            ],
            [
                'label' => 'Pending Queue',
                'value' => (clone $base)->where('status', 'PENDING')->count(),
                'sub' => 'Awaiting decision',
                'accent' => 'amber',
                'icon' => 'fa-inbox',
            ],
        ];

        return Inertia::render('Partner/Analytics', [
            'tiles' => $tiles,
            'has_listings' => $total > 0,
            'variant' => 'finance',
        ]);
    }

    private function sellThrough($listings): int
    {
        $withCapacity = $listings->filter(fn ($l) => $l->capacity > 0);
        if ($withCapacity->isEmpty()) {
            return 0;
        }
        $sold = $withCapacity->sum('sold_count');
        $cap = $withCapacity->sum('capacity');

        return $cap > 0 ? (int) round(($sold / $cap) * 100) : 0;
    }
}
