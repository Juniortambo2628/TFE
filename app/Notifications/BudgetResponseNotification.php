<?php

namespace App\Notifications;

use App\Models\Budget;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Sprint 17 — fires to the fan when a travel partner responds to
 * their itinerary brief (approved / modified / rejected).
 * Sprint 21 — ShouldQueue for parity with the other approval notifications.
 */
class BudgetResponseNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Budget $budget,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $status = strtolower($this->budget->partner_status ?? '');
        $ref = 'REQ-'.str_pad($this->budget->id, 6, '0', STR_PAD_LEFT);
        $iconByStatus = [
            'approved' => 'fas fa-check-circle',
            'modified' => 'fas fa-edit',
            'rejected' => 'fas fa-times-circle',
        ];
        $labelByStatus = [
            'approved' => 'quoted your trip',
            'modified' => 'proposed changes to your trip',
            'rejected' => 'declined your itinerary',
        ];

        return [
            'title' => 'Partner response · '.$ref,
            'body' => 'A travel partner '.($labelByStatus[$status] ?? 'updated your itinerary').'.',
            'icon' => $iconByStatus[$status] ?? 'fas fa-suitcase',
            'action_url' => route('fan.itineraries'),
            'type' => 'budget_response',
            'budget_id' => $this->budget->id,
            'partner_status' => $this->budget->partner_status,
            'partner_cost' => $this->budget->partner_cost,
        ];
    }
}
