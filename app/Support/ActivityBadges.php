<?php

namespace App\Support;

use App\Models\User;

/**
 * Sidebar / top-nav badges for new activity (Sprint 70).
 *
 * ONE map from a nav route to the notification `type`s that count towards
 * it. The same map clears them: opening a section marks its notifications
 * read, so a badge means "something you have not looked at", never a count
 * that only goes up.
 *
 * Messages are counted from messages.is_read (they are not notifications),
 * shared separately as unreadMessagesCount. Opening the header's envelope
 * reads them, with the announcements on the same page; opening the bell
 * reads every notification (NotificationController::seen / messagesSeen).
 */
class ActivityBadges
{
    /** route name => notification data.type values */
    public const SECTIONS = [
        'fan.feed' => ['social'],
        'fan.tribes' => ['tribe'],
        'fan.events' => ['event'],
        'fan.communication' => ['announcement'],
        'fan.itineraries' => ['budget_response'],
        'fan.loan-applications' => ['loan_status_update'],
        'fan.journey' => ['booking_paid', 'booking_hold_expiring'],
        'partner.listings' => ['listing_moderation'],
    ];

    /**
     * Routes that clear a section too: a booking page is where the payment
     * notifications point, a tribe page is where tribe alerts point.
     */
    private const CLEARED_BY = [
        'fan.bookings.show' => 'fan.journey',
        'fan.tribes.show' => 'fan.tribes',
        'fan.tribes.posts.show' => 'fan.tribes',
        'fan.feed.post.show' => 'fan.feed',
    ];

    /** @return array<string, int> route name => count, zeros omitted */
    public static function for(User $user): array
    {
        $query = $user->unreadNotifications();
        // The grammar's own JSON path: json_unquote(json_extract(...)) on
        // MySQL, json_extract on SQLite. A raw json_extract returns the
        // quoted JSON string on MySQL and would match nothing.
        $type = $query->getQuery()->getGrammar()->wrap('data->type');

        $byType = $query
            ->selectRaw("{$type} as t, count(*) as n")
            ->groupByRaw($type)
            ->pluck('n', 't');

        $badges = [];
        foreach (self::SECTIONS as $route => $types) {
            $n = (int) collect($types)->sum(fn ($t) => $byType[$t] ?? 0);
            if ($n > 0) {
                $badges[$route] = $n;
            }
        }

        // Unread messages are deliberately NOT added here. They are shared
        // as unreadMessagesCount, and the client adds them to the Messages
        // row and the envelope for every role (lib/activityCounts). Adding
        // them here too counted each unread message twice (Nov 2026).

        return $badges;
    }

    /** Opening a section reads what its badge was counting. */
    public static function clearFor(User $user, ?string $routeName): void
    {
        $section = self::CLEARED_BY[$routeName] ?? $routeName;
        $types = self::SECTIONS[$section] ?? null;

        if (! $types) {
            return;
        }

        $user->unreadNotifications()
            ->whereIn('data->type', $types)
            ->update(['read_at' => now()]);
    }
}
