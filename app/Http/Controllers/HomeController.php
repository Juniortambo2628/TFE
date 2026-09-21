<?php

namespace App\Http\Controllers;

use App\Models\SiteSetting;
use App\Traits\ResolvesTournament;
use Illuminate\Support\Facades\Schema;
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

    // Standalone public section pages. Each renders the shared PageHero (config
    // defaults + admin CMS overrides) plus the section component.
    public function about()
    {
        return Inertia::render('Sections/About', ['hero' => $this->pageHero('about')]);
    }

    public function features()
    {
        return Inertia::render('Sections/Features', ['hero' => $this->pageHero('features')]);
    }

    public function services()
    {
        return Inertia::render('Sections/Services', ['hero' => $this->pageHero('services')]);
    }

    public function news()
    {
        return Inertia::render('Sections/News', ['hero' => $this->pageHero('news')]);
    }

    public function contact()
    {
        return Inertia::render('Sections/Contact', ['hero' => $this->pageHero('contact')]);
    }

    /**
     * Hero content for a section page: config/site_pages.php defaults, with any
     * admin CMS override (SiteSetting `page_hero_{slug}_{field}`) laid over the
     * top. Tolerates a missing site_settings table (fresh installs).
     */
    private function pageHero(string $slug): array
    {
        $hero = config("site_pages.{$slug}", []);

        try {
            if (Schema::hasTable('site_settings')) {
                foreach (['title', 'eyebrow', 'tagline', 'background', 'cta_label', 'cta_href'] as $field) {
                    $value = SiteSetting::get("page_hero_{$slug}_{$field}");
                    if (! empty($value)) {
                        $hero[$field] = $value;
                    }
                }
            }
        } catch (\Throwable $e) {
            // best-effort — config defaults still apply.
        }

        return $hero;
    }
}
