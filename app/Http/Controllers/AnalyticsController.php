<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsEvent;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function track(Request $request)
    {
        $request->validate([
            'event' => 'required|string',
            'data' => 'nullable|array',
        ]);

        AnalyticsEvent::log($request->event, $request->data);

        return response()->json(['status' => 'success']);
    }
}
