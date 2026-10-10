<?php

namespace Tests\Feature\Fan;

use App\Models\Booking;
use App\Models\NotificationContact;
use App\Models\User;
use App\Notifications\BookingHoldExpiringNotification;
use App\Services\SmsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Opt-in SMS / WhatsApp alerts and the hold-expiry reminder (Sprint 66).
 */
class TextAlertsTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_number_needs_consent(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('fan.text-alerts.store'), ['phone' => '0712345678', 'channel' => 'sms'])
            ->assertSessionHasErrors('consent');
        $this->assertSame(0, NotificationContact::count());
    }

    public function test_opt_in_verifies_with_a_code_then_opt_out_deletes_the_number(): void
    {
        $fan = User::factory()->create();
        $sent = null;
        Log::shouldReceive('info')->andReturnUsing(function ($line) use (&$sent) {
            if (preg_match('/code is (\d{6})/', $line, $m)) {
                $sent = $m[1];
            }
        });
        Log::shouldReceive('warning', 'error', 'debug')->andReturnNull();

        $this->actingAs($fan)->post(route('fan.text-alerts.store'), ['phone' => '0712 345 678', 'channel' => 'whatsapp', 'consent' => '1']);

        $contact = NotificationContact::first();
        $this->assertSame('+254712345678', $contact->phone);
        $this->assertFalse($contact->isVerified());

        $this->actingAs($fan)->post(route('fan.text-alerts.verify'), ['code' => '000000'])->assertSessionHasErrors('code');
        $this->actingAs($fan)->post(route('fan.text-alerts.verify'), ['code' => $sent])->assertSessionHasNoErrors();
        $this->assertTrue($contact->fresh()->isVerified());

        $this->actingAs($fan)->delete(route('fan.text-alerts.destroy'));
        $this->assertSame(0, NotificationContact::count());
    }

    public function test_numbers_are_normalised_or_refused(): void
    {
        $this->assertSame('+254712345678', SmsService::normalise('0712-345-678'));
        $this->assertSame('+2348012345678', SmsService::normalise('+234 801 234 5678'));
        $this->assertNull(SmsService::normalise('12345'));
    }

    public function test_an_expiring_hold_is_reminded_exactly_once(): void
    {
        Notification::fake();
        $fan = User::factory()->create();
        $booking = Booking::create([
            'user_id' => $fan->id, 'tournament_id' => 'afcon_2027', 'package_name' => 'Held', 'package_type' => 'Held',
            'status' => 'pending_payment', 'total_amount' => 900, 'currency' => 'USD', 'amount_paid' => 0,
            'booking_date' => now(), 'expires_at' => now()->addHours(6), 'flight_info' => 'economy',
            'accommodation' => '3_star', 'matches' => [],
        ]);

        $this->artisan('bookings:remind-expiring')->assertSuccessful();
        $this->artisan('bookings:remind-expiring')->assertSuccessful();

        Notification::assertSentToTimes($fan, BookingHoldExpiringNotification::class, 1);
        $this->assertNotNull($booking->fresh()->hold_reminded_at);
    }
}
