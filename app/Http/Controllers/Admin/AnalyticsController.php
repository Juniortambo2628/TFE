<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsEvent;
use App\Models\Budget;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function index()
    {
        // 1. Calculator Usage Over Time
        $calculatorUsage = AnalyticsEvent::where('event_name', 'calculator_use')
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->take(30)
            ->get();

        // 2. Saved Itineraries Over Time
        $savedItineraries = Budget::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->take(30)
            ->get();

        // 3. Partner Quote Stats
        $quoteStats = [
            'approved' => Budget::where('partner_status', 'approved')->count(),
            'modified' => Budget::where('partner_status', 'modified')->count(),
            'pending' => Budget::where('partner_status', 'pending')->count(),
        ];

        // 4. Price Modifications Analysis
        $priceModifications = Budget::where('partner_status', 'modified')
            ->whereNotNull('partner_cost')
            ->select('name', 'total_cost', 'partner_cost', DB::raw('(partner_cost - total_cost) as difference'))
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        $totalPriceDifference = Budget::where('partner_status', 'modified')
            ->whereNotNull('partner_cost')
            ->sum(DB::raw('partner_cost - total_cost'));

        return Inertia::render('Admin/Analytics', [
            'calculatorUsage' => $calculatorUsage,
            'savedItineraries' => $savedItineraries,
            'quoteStats' => $quoteStats,
            'priceModifications' => $priceModifications,
            'totalPriceDifference' => $totalPriceDifference,
            'stats' => [
                'total_calc_uses' => AnalyticsEvent::where('event_name', 'calculator_use')->count(),
                'total_saved' => Budget::count(),
                'avg_itinerary_cost' => Budget::avg('total_cost') ?: 0,
                'avg_calc_cost' => AnalyticsEvent::where('event_name', 'calculator_use')
                    ->avg('metadata->estimated_cost') ?: 0,
            ]
        ]);
    }
}
