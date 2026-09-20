<?php

namespace App\Providers;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if ($this->app->environment('production')) {
            $this->app->bind('path.public', function () {
                return base_path('../public_html');
            });
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        Schema::defaultStringLength(191);

        // NOTE: Vite::prefetch() (blanket asset prefetch) is deliberately
        // NOT enabled. It injects a script that eagerly downloads EVERY
        // chunk in the manifest (~100 files / multiple MB) on every page
        // load — even the login page pulled the whole app, which read as
        // "the site is extremely slow" on slower connections. With it off,
        // each page loads only its own chunk and subsequent SPA navigations
        // fetch page chunks on demand (small, fast). If instant navigation
        // is wanted later, prefer Inertia's per-link prefetch
        // (<Link prefetch="hover">) over prefetching the entire manifest.
    }
}
