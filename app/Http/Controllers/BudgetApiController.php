<?php

namespace App\Http\Controllers;

use App\Services\TournamentBudgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BudgetApiController extends Controller
{
    public function __construct(
        private TournamentBudgetService $budgetService,
    ) {}

    /**
     * POST /api/budget/estimate
     *
     * Returns a real-time budget estimate combining live API data with
     * tournament-specific pricing.
     */
    public function estimate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'tournament_id' => 'required|string|exists:config:config/tournaments.php',
            'origin_code' => 'required|string|size:3',
            'destination_city' => 'required|string',
            'departure_date' => 'required|date|after:today',
            'return_date' => 'required|date|after:departure_date',
            'nights' => 'required|integer|min:1|max:30',
            'flight_class' => 'required|in:economy,business,first',
            'spending_tier' => 'required|in:budget,mid_range,luxury',
            'group_size' => 'required|integer|min:1|max:20',
            'match_count' => 'required|integer|min:0|max:20',
            'knockout_pct' => 'required|integer|min:0|max:100',
            'passport_country' => 'required|string|size:3',
            'include_insurance' => 'boolean',
            'include_visa' => 'boolean',
            'include_merchandise' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $estimate = $this->budgetService->estimate($validator->validated());

            return response()->json([
                'success' => true,
                'data' => $estimate,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate estimate. Please try again.',
                'message' => app()->isLocal() ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * POST /api/budget/cost-of-living
     *
     * Returns cost-of-living data for a city (for UI display).
     */
    public function costOfLiving(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'city' => 'required|string',
            'country' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = \App\Services\CostOfLivingService::getDailyExpenses($request->city);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * POST /api/budget/exchange-rate
     *
     * Returns current exchange rate between two currencies.
     */
    public function exchangeRate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'from' => 'required|string|size:3',
            'to' => 'required|string|size:3',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $rate = \App\Services\CurrencyService::getExchangeRate($request->from, $request->to);

        return response()->json([
            'success' => true,
            'data' => [
                'from' => $request->from,
                'to' => $request->to,
                'rate' => $rate,
            ],
        ]);
    }

    /**
     * POST /api/budget/visa-info
     *
     * Returns visa information for a traveler's passport + destination.
     */
    public function visaInfo(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'passport_country' => 'required|string|size:3',
            'destination_country' => 'required|string|size:3',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $visaService = new \App\Services\VisaService();
        $info = $visaService->checkVisa($request->passport_country, $request->destination_country);

        return response()->json([
            'success' => true,
            'data' => $info,
        ]);
    }
}
