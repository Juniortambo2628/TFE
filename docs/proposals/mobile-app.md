# TFE as a mobile app — scope and plan

*Prepared 6 Nov 2026. For a team with no mobile release experience: what it
takes, in what order, what it costs, and what only you can do.*

## The recommendation in one paragraph

Don't rebuild TFE as a separate app. **Wrap the site we already have in a
native app shell (Capacitor)**, and add the few things only a real app can do:
push notifications, links that open in the app, Face ID / fingerprint sign-in,
and tickets that work offline. Everything else, including every page we've
built, keeps living on the web server, so a fix ships to the website and the
apps at the same time and there's still only one codebase. Before the stores,
make the site **installable from the browser (a PWA)**: about a week, no store
accounts needed, and most of it is reused by the app.

**Time to both stores: about 6–10 weeks**, much of it spent waiting: on
account verification (1–3 weeks), Google's closed testing period (2 weeks)
and Apple review (a few days). **Money: USD 99 a year (Apple) + USD 25 once
(Google)**, plus optional build-service and test-device costs below.

## Why this route

| Option | What it means | Verdict |
|---|---|---|
| **PWA** (installable website) | Add-to-home-screen, app icon, full screen, push on Android and iOS 16.4+ | **Do first.** Cheap, no stores, but not in the App Store or Play Store, where people look. |
| **Capacitor shell** (recommended) | A real iOS + Android app that shows our site, plus native plugins | **Do second.** Reuses 100% of the UI and the Laravel backend. In both stores. |
| React Native / Flutter rewrite | A second front end written from scratch | **Not now.** 4–6 months, two UIs to keep in step, and our tester feedback is about the flows, not the rendering. Worth revisiting only if the app outgrows the site. |

The site is already shaped for this: the bottom tab bar, the phone dialogs,
safe-area padding for the iPhone notch and home bar, and the one-page booking
flow were all built for phones this round.

## The phases

### Phase 0: installable website (PWA), ~1 week, no accounts needed

- App manifest (name, icons, theme colour, start page `/fan/dashboard` or `/`).
- Icon set from the TFE logo (iOS, Android, maskable).
- A service worker that caches the app's own files and shows a proper
  "you're offline" page instead of the browser's error.
- An "Install the app" prompt for returning visitors (Android) and a short
  how-to card on iPhone (Share → Add to Home Screen).
- Web push for quotes, payments and holds about to expire. This reuses the
  notifications we already send to the bell and by SMS.

### Phase 1: the app shell, ~2–3 weeks

- A `mobile/` folder in this repo with the Capacitor iOS and Android projects.
  It loads `https://tfe.okjtech.co.ke`; the app's own files hold the splash
  screen, the offline page and the native code.
- Native status bar, splash screen, keyboard and safe areas; the Android
  back button walks back through the app instead of closing it.
- **Sign-in needs care.** Google blocks its sign-in page inside embedded web
  views, so "Continue with Google" has to open the system browser and come
  back to the app through a link. Passkeys work in iOS 16+ and recent
  Android once the app and site prove they belong together (two small files
  the site serves, `apple-app-site-association` and `assetlinks.json`).
  Email + password works as it is.
- **Payments.** Paystack / M-Pesa checkout opens in an in-app browser sheet
  and returns to the booking page. Apple and Google both *require* that
  physical goods and real-world services (travel, match tickets, stays) are
  paid **outside** their in-app purchase system, so we pay them no commission
  and keep Paystack (App Store guideline 3.1.3(e) / 3.1.5).
- Links to other sites open in the system browser, not inside the app.

### Phase 2: what makes it an app, not a website, ~2–4 weeks

Apple rejects apps that are "just a website in a box" (guideline 4.2,
minimum functionality). These features are what get us through review, and
they're also what fans would actually miss without an app:

- **Push notifications** through Firebase Cloud Messaging (free, covers iOS
  and Android). Server side: a device-token table and an FCM notification
  channel next to the database and SMS channels we already have.
- **Links that open in the app** (universal links / app links): a quote or
  payment SMS opens the booking in the app.
- **Face ID / fingerprint** to unlock the app and to pass the savings
  re-check, using the existing passkey support.
- **Offline match tickets**: e-tickets saved on the phone, so they open at a
  stadium with no signal. Apple Wallet / Google Wallet passes later.
- Native share sheet for trips and tribe invites.

### Phase 3: store release, ~1–2 weeks of work plus review time

- Store listings: name, subtitle, description, keywords, screenshots for
  each phone size (taken automatically from the seeded demo, as for /v2).
- Privacy answers: Apple's "App Privacy" labels and Google's "Data safety"
  form. Ours are short, because TFE holds no savings, no pupil data and no
  card data.
- A demo account for the reviewers, with notes on what to try.
- Beta testing: TestFlight (iOS) and a closed test track (Android). **Google
  requires new personal developer accounts to run a closed test with at least
  12 testers for 14 days before going public.** An organisation account
  avoids that, which is another reason to enrol as the company.

### Phase 4: ongoing

- Each release built and uploaded by GitHub Actions (Fastlane), the way the
  site deploys today. iOS builds need a macOS machine: GitHub's macOS runners
  (billed per minute) or a service such as Codemagic (free tier ~500
  minutes/month).
- Because the pages come from the server, **most changes need no app
  update**. A store release is only needed when the native shell changes
  (new plugin, icon, permissions).

## Decisions and actions only you can take

1. **Enrol both developer accounts as the company** (OKJ Technologies, or
   whichever entity should be the publisher):
   - Apple Developer Program, USD 99/year. An organisation needs a
     **D-U-N-S number** (free from Dun & Bradstreet, takes about 1–2 weeks).
     Start this first; it's the longest wait.
   - Google Play Console, USD 25 once. An organisation account also asks for
     the D-U-N-S number.
2. **Give the build pipeline access**, not your passwords: an App Store
   Connect API key and a Google Play service-account key, saved as GitHub
   secrets. I'll send step-by-step instructions when you get there.
3. **Name and ID**: the store name ("The Football Experience"?) and a
   permanent app ID such as `ke.co.okjtech.tfe`. The ID can never change
   after the first release.
4. **Betting content.** GoalBet is a sponsor whose listings appear on
   Predict. Apple and Google treat anything that looks like real-money
   gambling strictly (licences, country limits, an 18+ rating). The simplest
   path is to hide betting-partner listings in the app builds. Your call, and
   it may depend on the sponsorship.
5. **Test phones**: one iPhone and one Android phone you can install betas on.

## What I can do from here

All the code: the PWA, the Capacitor projects, the native plugins, the
push-notification server side, the link files, the offline tickets, the CI
build and upload workflows, store-listing copy, screenshots and the privacy
answers. What I can't do from this environment: sign in to Apple or Google
for you, run an iPhone simulator (it needs macOS; the CI's macOS runner
covers builds), or tap through the app on a real phone. You or a tester do
that from TestFlight and the Play test track.

## Suggested order

| Week | You | Me |
|---|---|---|
| 1 | Apply for D-U-N-S; decide the name, ID and betting question | Phase 0: PWA (manifest, icons, offline page, install prompt, web push) |
| 2–3 | Enrol in Apple + Google once D-U-N-S arrives | Phase 1: Capacitor shell, sign-in and payment returns, link files |
| 4–6 | Install betas from TestFlight / Play testing; send feedback | Phase 2: push, app links, Face ID, offline tickets; CI builds |
| 6–8 | Recruit testers for Google's closed test (if needed) | Phase 3: listings, screenshots, privacy answers, reviewer notes |
| 8–10 | Approve the listings | Submit; fix anything review raises |
