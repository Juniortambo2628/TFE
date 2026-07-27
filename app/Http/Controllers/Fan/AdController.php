<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Ad;

class AdController extends Controller
{
    /**
     * Track ad impression
     */
    public function trackImpression(Ad $ad)
    {
        $ad->incrementImpression();

        return response()->json(['success' => true]);
    }

    /**
     * Track ad click
     */
    public function trackClick(Ad $ad)
    {
        $ad->incrementClick();

        return response()->json(['success' => true]);
    }
}
