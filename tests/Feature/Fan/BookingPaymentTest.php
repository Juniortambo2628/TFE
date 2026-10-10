<?php

namespace Tests\Feature\Fan;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * In-app checkout (Sprint 65): demo settlement without a key, Paystack with one.
 */
class BookingPaymentTest extends TestCase
{
    use RefreshDatabase;

    /**
     * TestCase registers a catch-all Http::fake(), and the FIRST matching stub
     * wins — so start from a fresh factory before stubbing Paystack.
     */
    private function stubPaystack(array $stubs): void
    {
        Http::swap(new Factory);
        Http::fake($stubs);
    }

    private function booking(User $fan, array $overrides = []): Booking
    {
        return Booking::create(array_merge([
            'user_id' => $fan->id,
            'tournament_id' => 'afcon_2027',
            'package_name' => 'Nairobi Weekender',
            'package_type' => 'Nairobi Weekender',
            'status' => 'pending_payment',
            'total_amount' => 1500,
            'currency' => 'USD',
            'amount_paid' => 0,
            'booking_date' => now(),
            'expires_at' => now()->addHours(48),
            'flight_info' => 'economy',
            'accommodation' => '3_star',
            'matches' => [],
        ], $overrides));
    }

    public function test_demo_mode_settles_the_booking_without_a_gateway(): void
    {
        config(['services.paystack.secret' => null]);
        $fan = User::factory()->create();
        $booking = $this->booking($fan);

        $this->actingAs($fan)->post(route('fan.bookings.pay', $booking))
            ->assertRedirect(route('fan.bookings.show', $booking));

        $this->assertSame('confirmed', $booking->fresh()->status);
        $this->assertEquals(1500, $booking->fresh()->amount_paid);
        $this->assertSame('demo', Payment::first()->payment_method);
    }

    public function test_another_fan_cannot_pay_or_see_a_booking(): void
    {
        $owner = User::factory()->create();
        $booking = $this->booking($owner);

        $this->actingAs(User::factory()->create())
            ->post(route('fan.bookings.pay', $booking))
            ->assertForbidden();
    }

    public function test_an_expired_hold_cannot_be_paid(): void
    {
        $fan = User::factory()->create();
        $booking = $this->booking($fan, ['expires_at' => now()->subHour()]);

        $this->actingAs($fan)->post(route('fan.bookings.pay', $booking))->assertSessionHas('error');
        $this->assertSame('pending_payment', $booking->fresh()->status);
    }

    public function test_paystack_checkout_is_verified_server_side_before_settling(): void
    {
        config(['services.paystack.secret' => 'sk_test_x']);
        $this->stubPaystack([
            'https://api.paystack.co/transaction/initialize' => Http::response(['data' => ['authorization_url' => 'https://checkout.paystack.com/abc']]),
            'https://api.paystack.co/transaction/verify/*' => Http::response(['data' => ['status' => 'success', 'amount' => 150000, 'currency' => 'USD']]),
        ]);
        $fan = User::factory()->create();
        $booking = $this->booking($fan);

        $this->actingAs($fan)->post(route('fan.bookings.pay', $booking), [], ['X-Inertia' => 'true'])
            ->assertSessionHasNoErrors()
            ->assertStatus(409)
            ->assertHeader('X-Inertia-Location', 'https://checkout.paystack.com/abc');

        $reference = Payment::first()->transaction_id;
        $this->assertSame('pending_payment', $booking->fresh()->status);

        $this->actingAs($fan)->get(route('fan.bookings.pay.callback', [$booking, 'reference' => $reference]))
            ->assertRedirect(route('fan.bookings.show', $booking));

        $this->assertSame('confirmed', $booking->fresh()->status);
        $this->assertSame('completed', Payment::first()->status);
    }

    public function test_an_underpaid_paystack_transaction_does_not_settle(): void
    {
        config(['services.paystack.secret' => 'sk_test_x']);
        $this->stubPaystack([
            'https://api.paystack.co/transaction/initialize' => Http::response(['data' => ['authorization_url' => 'https://checkout.paystack.com/abc']]),
            'https://api.paystack.co/transaction/verify/*' => Http::response(['data' => ['status' => 'success', 'amount' => 100, 'currency' => 'USD']]),
        ]);
        $fan = User::factory()->create();
        $booking = $this->booking($fan);

        $this->actingAs($fan)->post(route('fan.bookings.pay', $booking), [], ['X-Inertia' => 'true']);
        $reference = Payment::first()->transaction_id;
        $this->actingAs($fan)->get(route('fan.bookings.pay.callback', [$booking, 'reference' => $reference]));

        $this->assertSame('pending_payment', $booking->fresh()->status);
        $this->assertSame('failed', Payment::first()->status);
    }
}
