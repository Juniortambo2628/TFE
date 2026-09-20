<!DOCTYPE html>
<html class="dark" lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'The Football Experience') }}</title>
        <link rel="icon" type="image/png" href="{{ asset('assets/img/logo/TFE-logo.png') }}">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">

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
        @endif

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
        
        <!-- Iconify icons (used by landing page Header) -->
        <script src="{{ asset('assets/libs/iconify-icon.min.js') }}"></script>
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
