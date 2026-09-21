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

    // Standalone public section pages. Each renders the same landing chrome
    // (header + section + footer); the section content itself lives in the
    // shared React section components, so there is no per-section payload here.
    public function about()
    {
        return Inertia::render('Sections/About');
    }

    public function features()
    {
        return Inertia::render('Sections/Features');
    }

    public function services()
    {
        return Inertia::render('Sections/Services');
    }

    public function news()
    {
        return Inertia::render('Sections/News');
    }

    public function contact()
    {
        return Inertia::render('Sections/Contact');
    }
}
