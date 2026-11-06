<?php

namespace App\Support;

use App\Models\Booking;
use App\Models\Budget;

/**
 * The one thing a fan should do next (Sprint 65): pay a held booking, accept
 * a partner's quote, wait on one, or start planning. The fan dashboard leads
 * with it and the side panel shows it on every fan page (UX plan, Nov 2026),
 * from this one place so the two cannot disagree.
 */
class NextStep
{
    public static function forFan(int $userId, string $tournamentId, bool $isConcluded): ?array
    {
        $held = Booking::where('user_id', $userId)
            ->where('status', 'pending_payment')
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->orderByRaw('expires_at IS NULL, expires_at ASC')
            ->first();

        if ($held) {
            return [
                'kind' => 'pay',
                'title' => 'Pay to secure '.$held->package_name,
                'amount' => round((float) $held->total_amount - (float) $held->amount_paid, 2),
                'currency' => $held->currency ?: 'USD',
                'expires_at' => $held->expires_at?->toIso8601String(),
                'href' => route('fan.bookings.show', $held),
                'cta' => 'Pay now',
            ];
        }

        $quoted = Budget::where('user_id', $userId)
            ->whereIn('partner_status', ['approved', 'modified'])
            ->latest('updated_at')
            ->first();

        if ($quoted) {
            return [
                'kind' => 'accept',
                'title' => 'A partner quoted '.$quoted->name,
                'amount' => (float) ($quoted->partner_cost ?: $quoted->total_cost),
                'currency' => $quoted->currency ?: 'USD',
                'href' => route('fan.itineraries', ['accept' => $quoted->id]),
                'cta' => 'Accept & pay',
            ];
        }

        if ($isConcluded) {
            return null;
        }

        $waiting = Budget::where('user_id', $userId)
            ->where('tournament_id', $tournamentId)
            ->where('is_active', true)
            ->whereNotNull('listing_id')
            ->where(fn ($q) => $q->whereNull('partner_status')->orWhere('partner_status', 'pending'))
            ->first();

        if ($waiting) {
            return [
                'kind' => 'wait',
                'title' => 'Waiting on a partner quote for '.$waiting->name,
                'href' => route('fan.itineraries'),
                'cta' => 'View plan',
            ];
        }

        return [
            'kind' => 'plan',
            'title' => 'Plan your trip in three steps',
            'href' => route('fan.budget-calculator'),
            'cta' => 'Start planning',
        ];
    }
}
