<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\VirtualCard;
use App\Models\VirtualCardTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * VirtualCardController — Ecobank Fan Finance's multicurrency virtual
 * card. Demo-only: no real issuer integration, no real PAN. Every card
 * is watermarked DEMO on the UI. On activation we generate a
 * deterministic mock PAN, expiry and CVV and seed multi-currency
 * balances so the fan can see per-currency spend tiles.
 */
class VirtualCardController extends Controller
{
    /** Currencies the card supports out of the box. USD wallet is primary. */
    private const CURRENCIES = ['USD', 'EUR', 'GBP', 'KES', 'ZAR', 'NGN', 'XOF'];

    private const DEFAULT_BALANCES = [
        'USD' => 500, 'EUR' => 400, 'GBP' => 300,
        'KES' => 20000, 'ZAR' => 6000, 'NGN' => 150000, 'XOF' => 100000,
    ];

    public function show(Request $request)
    {
        $card = VirtualCard::where('user_id', $request->user()->id)->with('transactions')->first();

        return Inertia::render('Fan/VirtualCard', [
            'card' => $card ? $this->format($card) : null,
            'partner' => $this->partnerPayload(),
            'currencies' => self::CURRENCIES,
        ]);
    }

    public function activate(Request $request)
    {
        $partner = User::where('email', 'finance@tfe.com')->first();
        if (! $partner) {
            return back()->withErrors(['partner' => 'Ecobank Fan Finance is not seeded on this environment.']);
        }

        $user = $request->user();
        $existing = VirtualCard::where('user_id', $user->id)->first();
        if ($existing) {
            return redirect()->route('fan.virtual-card')->with('info', 'Your virtual card is already active.');
        }

        $pan = $this->mockPan();
        $card = VirtualCard::create([
            'user_id' => $user->id,
            'partner_id' => $partner->id,
            'holder_name' => strtoupper($user->name ?? 'FAN CARDHOLDER'),
            'pan' => $pan,
            'last4' => substr($pan, -4),
            'expiry' => now()->addYears(3)->format('m/y'),
            'cvv' => (string) random_int(100, 999),
            'network' => 'visa',
            'status' => 'active',
            'balances' => self::DEFAULT_BALANCES,
        ]);

        // Two seeded transactions so the ledger isn't empty on first
        // view — one credit (top-up) and one small debit.
        VirtualCardTransaction::create([
            'virtual_card_id' => $card->id,
            'kind' => 'credit',
            'amount' => 500,
            'currency' => 'USD',
            'merchant' => 'Ecobank Wallet Top-up',
            'category' => 'top_up',
            'reference' => 'ECO-'.strtoupper(Str::random(6)),
            'posted_at' => now()->subDays(3),
        ]);
        VirtualCardTransaction::create([
            'virtual_card_id' => $card->id,
            'kind' => 'debit',
            'amount' => 24.90,
            'currency' => 'USD',
            'merchant' => 'TFE Fan Store',
            'category' => 'merchandise',
            'reference' => 'ECO-'.strtoupper(Str::random(6)),
            'posted_at' => now()->subDays(1),
        ]);

        return redirect()->route('fan.virtual-card')->with('success', 'Virtual card activated.');
    }

    private function mockPan(): string
    {
        // Test/demo BIN 4000-0000-* — obviously not a real card. Pad
        // the last 8 digits with random ints so the last4 varies.
        return '4000000000'.str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
    }

    private function partnerPayload(): array
    {
        $partner = User::with('partnerProfile')->where('email', 'finance@tfe.com')->first();
        if (! $partner || ! $partner->partnerProfile) {
            return ['display_name' => 'Ecobank Fan Finance', 'slug' => 'ecobank-fan-finance', 'theme_accent' => '#0072CE'];
        }
        $p = $partner->partnerProfile;

        return [
            'slug' => $p->slug,
            'display_name' => $p->display_name,
            'theme_accent' => $p->theme_accent ?: '#0072CE',
            'logo_url' => $p->logo_url,
        ];
    }

    private function format(VirtualCard $card): array
    {
        return [
            'id' => $card->id,
            'holder_name' => $card->holder_name,
            'masked_pan' => $card->maskedPan(),
            'last4' => $card->last4,
            'expiry' => $card->expiry,
            'network' => $card->network,
            'status' => $card->status,
            'balances' => $card->balances,
            'transactions' => $card->transactions->map(fn ($t) => [
                'id' => $t->id,
                'kind' => $t->kind,
                'amount' => (float) $t->amount,
                'currency' => $t->currency,
                'merchant' => $t->merchant,
                'category' => $t->category,
                'reference' => $t->reference,
                'posted_at' => $t->posted_at,
            ])->all(),
        ];
    }
}
