<?php

namespace App\Http\Controllers;

use App\Traits\ResolvesTournament;
use Inertia\Inertia;

/**
 * HomeController — Landing page.
 *
 * The active tournament (venues, teams, matches, results, hero image, trophy)
 * is shared globally via HandleInertiaRequests. This controller no longer
 * carries any tournament-specific data — everything the Hero renders comes
 * from the resolved tournament payload on the frontend.
 */
class HomeController extends Controller
{
    use ResolvesTournament;

    public function index()
    {
        return Inertia::render('Home', [
            'appName' => config('app.name'),
        ]);
    }
}
