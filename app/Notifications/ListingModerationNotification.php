<?php

namespace App\Notifications;

use App\Models\Listing;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Sprint 17 — fires to a partner when admin approves or rejects one
 * of their published listings. Rejection carries the moderation
 * notes so the partner sees the feedback inline.
 *
 * Sprint 21 — ShouldQueue so a bulk moderation of 200 listings doesn't
 * block the request on 200 sequential DB inserts. Sync driver (dev
 * default) still runs inline; database driver (prod) needs a worker.
 */
class ListingModerationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Listing $listing,
        public string $decision, // 'approved' | 'rejected'
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $approved = $this->decision === 'approved';

        return [
            'title' => $approved
                ? 'Listing approved'
                : 'Listing returned',
            'body' => $approved
                ? "Your listing “{$this->listing->name}” is now live on the platform."
                : "Admin returned “{$this->listing->name}” with feedback.".
                  ($this->listing->moderation_notes ? ' “'.$this->listing->moderation_notes.'”' : ''),
            'icon' => $approved ? 'fas fa-check-circle' : 'fas fa-undo',
            'action_url' => route('partner.listings.index'),
            'type' => 'listing_moderation',
            'listing_id' => $this->listing->id,
            'decision' => $this->decision,
        ];
    }
}
