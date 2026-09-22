<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\IsAdmin;
use App\Http\Middleware\IsPartner;
use App\Http\Middleware\ResolveTournament;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            ResolveTournament::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'is_admin' => IsAdmin::class,
            'is_partner' => IsPartner::class,
        ]);

        // Sprint 44 — analytics is a fire-and-forget metric write that
        // holds no session state and no secret, so it stays off the CSRF
        // check to avoid drowning the console in 419s from long-open tabs.
        // SerpAPI proxy endpoints stay CSRF-protected: they burn a paid
        // upstream quota and are worth defending from cross-origin fires.
        $middleware->validateCsrfTokens(except: [
            'analytics/track',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
