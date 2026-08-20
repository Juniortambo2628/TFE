<?php

namespace App\Http\Controllers;

use App\Services\SerpApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SerpApiController extends Controller
{
    public function __construct(
        private SerpApiService $serpApi,
    ) {}

    /**
     * POST /api/search/flights
     */
    public function searchFlights(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'departure_id' => 'required|string|size:3',
            'arrival_id' => 'required|string|size:3',
            'outbound_date' => 'required|date',
            'return_date' => 'nullable|date|after:outbound_date',
            'adults' => 'integer|min:1|max:9',
            'travel_class' => 'in:1,2,3,4',
            'stops' => 'in:0,1,2,3',
            'max_price' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $result = $this->serpApi->searchFlights($validator->validated());

        return response()->json([
            'success' => ! isset($result['error']),
            'data' => $result,
        ]);
    }

    /**
     * POST /api/search/hotels
     */
    public function searchHotels(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'q' => 'required|string',
            'check_in_date' => 'required|date',
            'check_out_date' => 'required|date|after:check_in_date',
            'adults' => 'integer|min:1|max:9',
            'sort_by' => 'in:3,8,13',
            'min_price' => 'nullable|integer|min:0',
            'max_price' => 'nullable|integer|min:0',
            'hotel_class' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $result = $this->serpApi->searchHotels($validator->validated());

        return response()->json([
            'success' => ! isset($result['error']),
            'data' => $result,
        ]);
    }
}
