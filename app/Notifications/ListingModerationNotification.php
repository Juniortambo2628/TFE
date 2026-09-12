<?php

namespace App\Notifications;

use App\Models\Listing;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
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
        // Sprint 35 — broadcast alongside database so the fan/partner
        // bell dropdown updates without a page refresh when Reverb is
        // reachable. The `broadcast` channel is a no-op with
        // BROADCAST_CONNECTION=log (dev default) so nothing changes for
        // tests / local envs without a Reverb server.
        return ['database', 'broadcast'];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        // Echo the same payload the bell dropdown reads from the DB —
        // the client can drop it straight into local state without a
        // second fetch.
        return new BroadcastMessage($this->toArray($notifiable));
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
