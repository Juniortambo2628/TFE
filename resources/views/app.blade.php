<!DOCTYPE html>
<html class="dark" lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        {{-- viewport-fit=cover lets the installed app (and Safari) draw
             under the notch and home bar; the tab bar and dialogs already
             pad for them with env(safe-area-inset-*). --}}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'The Football Experience') }}</title>
        <link rel="icon" type="image/png" href="{{ asset('assets/img/logo/TFE-logo.png') }}">

        {{-- Installable website (docs/proposals/mobile-app.md, phase 0):
             the manifest, the home-screen icons and the app's own bar
             colour. The service worker is registered from app.jsx. --}}
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="theme-color" content="#0a0a0c">
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="TFE">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        {{-- Font Awesome is self-hosted (see public/assets/libs +
             public/assets/webfonts). Serving it from our own origin removes
             a render-blocking third-party request to cdnjs — which is
             especially slow/unreliable on the networks our fans use — and
             keeps icons working even if a CDN is blocked. The solid weight
             (used the most) is preloaded so icons don't flash in. --}}
        <link rel="preload" href="{{ asset('assets/webfonts/fa-solid-900.woff2') }}" as="font" type="font/woff2" crossorigin>
        <link rel="stylesheet" href="{{ asset('assets/libs/font-awesome.min.css') }}">

        {{-- Landing template styles bleed into dashboard pages (body
             background, huge TFE watermark, flat hero cards) — only load
             on public/marketing pages, not on Fan/Admin/Partner dashboards. --}}
        @php
            $component = $page['component'] ?? '';
            $isDashboard = str_starts_with($component, 'Fan/')
                || str_starts_with($component, 'Admin/')
                || str_starts_with($component, 'Partner/');
        @endphp
        @unless ($isDashboard)
            <link rel="stylesheet" href="{{ asset('new-landing-template/assets/css/styles.css') }}">
        @endunless

        {{-- Sprint 32 — Bootstrap utilities + grid on dashboards.
             The dashboard JSX is peppered with `d-flex`, `flex-column`,
             `justify-content-*`, `align-items-*`, `p-*`, `gap-*`, `row g-*`
             and `col-md-*` classes that were no-ops on Fan/Admin/Partner
             surfaces because the full landing stylesheet is gated above.
             We deliberately load only the utilities + grid modules so we
             get layout classes without pulling in Bootstrap's reset,
             typography, or component styles — those clobber the fan
             design tokens (learned the hard way in Sprint 11). --}}
        @if ($isDashboard)
            <link rel="stylesheet" href="{{ asset('new-landing-template/assets/css/bootstrap-utilities.css') }}">
            <link rel="stylesheet" href="{{ asset('new-landing-template/assets/css/bootstrap-grid.css') }}">
            {{-- Bootstrap's `.border` is `!important` and paints #dee2e6, so
                 a Tailwind `border border-white/10` on a dashboard came out
                 as a light-grey outline on the dark canvas. Point its colour
                 at the theme hairline instead. --}}
            <style>:root { --bs-border-color: var(--border-divider, rgba(255, 255, 255, 0.1)); --bs-border-color-translucent: var(--border-divider, rgba(255, 255, 255, 0.1)); }</style>
        @endif

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
        
        {{-- Iconify defines the <iconify-icon> web component (Header,
             Footer, landing cards, TournamentSwitcher). Deferred so it
             doesn't block the parser in <head>; the custom element upgrades
             its instances as soon as the script finishes, so icons still
             appear without a render-blocking request. --}}
        <script defer src="{{ asset('assets/libs/iconify-icon.min.js') }}"></script>
    </head>
    <body class="font-sans antialiased">
        @inertia
        
        <!-- Google Translate Widget Container (Moved to Header) -->
        <!-- <div id="google_translate_element"></div> -->
        
        <script type="text/javascript">
            function googleTranslateElementInit() {
                window.googleTranslateLoaded = true;
                window.dispatchEvent(new Event('google-translate-loaded'));
            }
        </script>
        {{-- Deferred: the Google Translate widget is not needed for first
             paint. Loading it defer (and letting the callback fire after
             parse) keeps it off the critical path so pages become
             interactive sooner. --}}
        <script defer type="text/javascript" src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
    </body>
</html>
