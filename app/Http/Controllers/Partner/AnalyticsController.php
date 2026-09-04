<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
