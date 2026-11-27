<?php

namespace Tests\Feature\Fan;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\BookingPaidNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Direct M-Pesa (Daraja STK push, Nov 2026) — the phone rail beside
 * Paystack's card rail: the prompt lands on the fan's SIM, the result comes
 * back server-to-server at route('mpesa.callback'), and a lost callback is
 * recovered by stkQuery on the booking page's poll.
 */
class MpesaDirectTest extends TestCase
{
    use RefreshDatabase;

    /**
     * TestCase registers a catch-all Http::fake(), and the FIRST matching stub
     * wins — so start from a fresh factory before stubbing Daraja.
     */
    private function stubDaraja(array $stubs): void
    {
        Http::swap(new Factory);
        Http::fake($stubs);
    }

    private function configureMpesa(bool $withRate = true): void
    {
        config([
            'services.mpesa.env' => 'sandbox',
            'services.mpesa.shortcode' => '174379',
            'services.mpesa.consumer_key' => 'ck_test',
            'services.mpesa.consumer_secret' => 'cs_test',
            'services.mpesa.passkey' => 'pk_test',
            'services.mpesa.kes_per_usd' => $withRate ? 130 : null,
            // The Sprint-66 fallback must not quietly supply the rate.
            'services.paystack.kes_per_usd' => null,
        ]);
    }

    private function darajaEndpoints(array $overrides = []): array
    {
        return array_merge([
            'https://sandbox.safaricom.co.ke/oauth/v1/generate*' => Http::response([
                'access_token' => 'tok_test',
                'expires_in' => 3599,
            ]),
        ], $overrides);
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

    private function pendingPayment(Booking $booking, array $overrides = []): Payment
    {
        return Payment::create(array_merge([
            'user_id' => $booking->user_id,
            'booking_id' => $booking->id,
            'amount' => 195000,
            'currency' => 'KES',
            'settles_amount' => 1500,
            'payment_method' => 'mpesa',
            'transaction_id' => 'TFE-'.$booking->id.'-TESTREF',
            'status' => 'pending',
            'gateway_reference' => 'wco_test123',
        ], $overrides));
    }

    // ── The push ──────────────────────────────────────────────────────────

    public function test_a_direct_stk_push_records_the_attempt_and_returns_to_the_page(): void
    {
        $this->configureMpesa();
        $this->stubDaraja($this->darajaEndpoints([
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest' => Http::response([
                'ResponseCode' => '0',
                'ResponseDescription' => 'Success. Request accepted for processing',
                'MerchantRequestID' => 'm-1',
                'CheckoutRequestID' => 'wco_abc123',
                'CustomerMessage' => 'Success. Request accepted for processing',
            ]),
        ]));
        $fan = User::factory()->create();
        $booking = $this->booking($fan);

        $this->actingAs($fan)->post(route('fan.bookings.pay', $booking), [
            'method' => 'mpesa',
            'phone' => '0712345678',
        ])
            ->assertRedirect(route('fan.bookings.show', $booking))
            ->assertSessionHas('success');

        $payment = Payment::first();
        $this->assertSame('pending', $payment->status);
        $this->assertSame('KES', $payment->currency);
        $this->assertEquals(195000, $payment->amount);
        $this->assertEquals(1500, $payment->settles_amount);
        $this->assertSame('wco_abc123', $payment->gateway_reference);
        $this->assertSame('pending_payment', $booking->fresh()->status);

        Http::assertSent(fn ($r) => str_contains($r->url(), 'stkpush/v1/processrequest')
            && $r['BusinessShortCode'] === '174379'
            && $r['PhoneNumber'] === '254712345678'
            && $r['PartyA'] === '254712345678'
            && $r['Amount'] === 195000
            && str_contains($r['CallBackURL'], '/mpesa/callback'));
    }

    public function test_an_invalid_phone_is_refused_before_anything_is_sent(): void
    {
        $this->configureMpesa();
        $this->stubDaraja($this->darajaEndpoints());
        $fan = User::factory()->create();
        $booking = $this->booking($fan);

        $this->actingAs($fan)->post(route('fan.bookings.pay', $booking), [
            'method' => 'mpesa',
            'phone' => '12345',
        ])->assertSessionHas('error');

        $this->assertSame(0, Payment::count());
        Http::assertNothingSent();
    }

    public function test_a_usd_booking_without_a_conversion_rate_is_refused(): void
    {
        $this->configureMpesa(withRate: false);
        $this->stubDaraja($this->darajaEndpoints());
        $fan = User::factory()->create();
        $booking = $this->booking($fan);

        $this->actingAs($fan)->post(route('fan.bookings.pay', $booking), [
            'method' => 'mpesa',
            'phone' => '0712345678',
        ])->assertSessionHas('error');

        $this->assertSame(0, Payment::count());
        Http::assertNothingSent();
    }

    public function test_a_second_push_is_refused_while_a_prompt_is_live(): void
    {
        $this->configureMpesa();
        $this->stubDaraja($this->darajaEndpoints());
        $fan = User::factory()->create();
        $booking = $this->booking($fan);
        $this->pendingPayment($booking);

        $this->actingAs($fan)->post(route('fan.bookings.pay', $booking), [
            'method' => 'mpesa',
            'phone' => '0712345678',
        ])->assertSessionHas('error');

        $this->assertSame(1, Payment::count());
        Http::assertNothingSent();
    }

    public function test_a_stale_prompt_is_retired_so_a_retry_can_go_through(): void
    {
        $this->configureMpesa();
        $this->stubDaraja($this->darajaEndpoints([
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest' => Http::response([
                'ResponseCode' => '0',
                'CheckoutRequestID' => 'wco_retry',
            ]),
        ]));
        $fan = User::factory()->create();
        $booking = $this->booking($fan);
        $stale = $this->pendingPayment($booking, ['created_at' => now()->subMinutes(20)]);

        $this->actingAs($fan)->post(route('fan.bookings.pay', $booking), [
            'method' => 'mpesa',
            'phone' => '0712345678',
        ])->assertSessionHas('success');

        $this->assertSame('failed', $stale->fresh()->status);
        $this->assertSame('wco_retry', Payment::where('status', 'pending')->first()->gateway_reference);
    }

    // ── The callback ──────────────────────────────────────────────────────

    public function test_the_callback_settles_the_booking_and_stores_the_receipt(): void
    {
        $fan = User::factory()->create();
        $booking = $this->booking($fan);
        $payment = $this->pendingPayment($booking);
        Notification::fake();

        $this->postJson(route('mpesa.callback'), [
            'Body' => ['stkCallback' => [
                'MerchantRequestID' => 'm-1',
                'CheckoutRequestID' => 'wco_test123',
                'ResultCode' => 0,
                'ResultDesc' => 'The service request is processed successfully.',
                'CallbackMetadata' => ['Item' => [
                    ['Name' => 'Amount', 'Value' => 195000],
                    ['Name' => 'MpesaReceiptNumber', 'Value' => 'SGH789345'],
                    ['Name' => 'PhoneNumber', 'Value' => 254712345678],
                ]],
            ]],
        ])->assertOk()->assertJson(['ResultCode' => 0]);

        $payment->refresh();
        $this->assertSame('completed', $payment->status);
        $this->assertSame('SGH789345', $payment->gateway_receipt);
        $this->assertSame('confirmed', $booking->fresh()->status);
        $this->assertEquals(1500, $booking->fresh()->amount_paid);
        Notification::assertSentTo($fan, BookingPaidNotification::class);
    }

    public function test_a_replayed_callback_cannot_double_credit(): void
    {
        $fan = User::factory()->create();
        $booking = $this->booking($fan);
        $this->pendingPayment($booking);
        Notification::fake();

        $payload = ['Body' => ['stkCallback' => [
            'CheckoutRequestID' => 'wco_test123',
            'ResultCode' => 0,
            'CallbackMetadata' => ['Item' => [
                ['Name' => 'Amount', 'Value' => 195000],
                ['Name' => 'MpesaReceiptNumber', 'Value' => 'SGH789345'],
            ]],
        ]]];

        $this->postJson(route('mpesa.callback'), $payload)->assertOk();
        $this->postJson(route('mpesa.callback'), $payload)->assertOk();

        $this->assertEquals(1500, $booking->fresh()->amount_paid);
        $this->assertSame('confirmed', $booking->fresh()->status);
        Notification::assertSentTimes(BookingPaidNotification::class, 1, $fan);
    }

    public function test_a_callback_whose_amount_does_not_match_never_settles(): void
    {
        $fan = User::factory()->create();
        $booking = $this->booking($fan);
        $payment = $this->pendingPayment($booking);
        Notification::fake();

        // We asked Safaricom to charge 195000; a callback claiming 100 is not
        // the transaction we started — same rule as the Paystack verify.
        $this->postJson(route('mpesa.callback'), [
            'Body' => ['stkCallback' => [
                'CheckoutRequestID' => 'wco_test123',
                'ResultCode' => 0,
                'CallbackMetadata' => ['Item' => [
                    ['Name' => 'Amount', 'Value' => 100],
                ]],
            ]],
        ])->assertOk();

        $this->assertSame('failed', $payment->fresh()->status);
        $this->assertSame('pending_payment', $booking->fresh()->status);
        $this->assertEquals(0, $booking->fresh()->amount_paid);
        Notification::assertNotSentTo($fan, BookingPaidNotification::class);
    }

    public function test_a_cancelled_prompt_marks_the_payment_failed(): void
    {
        $fan = User::factory()->create();
        $booking = $this->booking($fan);
        $payment = $this->pendingPayment($booking);
        Notification::fake();

        // 1032 = "Request cancelled by user" at the PIN prompt.
        $this->postJson(route('mpesa.callback'), [
            'Body' => ['stkCallback' => [
                'CheckoutRequestID' => 'wco_test123',
                'ResultCode' => 1032,
                'ResultDesc' => 'Request cancelled by user',
            ]],
        ])->assertOk();

        $this->assertSame('failed', $payment->fresh()->status);
        $this->assertSame('pending_payment', $booking->fresh()->status);
        Notification::assertNotSentTo($fan, BookingPaidNotification::class);
    }

    public function test_an_unknown_or_malformed_callback_is_acknowledged_without_crashing(): void
    {
        $this->postJson(route('mpesa.callback'), [
            'Body' => ['stkCallback' => ['CheckoutRequestID' => 'wco_never_existed', 'ResultCode' => 0]],
        ])->assertOk();

        $this->postJson(route('mpesa.callback'), [])->assertOk();

        $this->assertSame(0, Payment::count());
    }

    // ── Lost-callback recovery (the page poll asks Safaricom directly) ───

    public function test_a_lost_callback_is_recovered_when_the_booking_page_loads(): void
    {
        $this->configureMpesa();
        $this->stubDaraja($this->darajaEndpoints([
            'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query' => Http::response([
                'ResponseCode' => '0',
                'MerchantRequestID' => 'm-1',
                'CheckoutRequestID' => 'wco_test123',
                'ResultCode' => 0,
                'ResultDesc' => 'The service request is processed successfully.',
                'CallbackMetadata' => ['Item' => [
                    ['Name' => 'Amount', 'Value' => 195000],
                    ['Name' => 'MpesaReceiptNumber', 'Value' => 'SGH555555'],
                ]],
            ]),
        ]));
        $fan = User::factory()->create();
        $booking = $this->booking($fan);
        // Old enough that the prompt (and its callback window) has passed.
        $payment = $this->pendingPayment($booking, ['created_at' => now()->subSeconds(80)]);
        Notification::fake();

        $this->actingAs($fan)->get(route('fan.bookings.show', $booking))->assertOk();

        $payment->refresh();
        $this->assertSame('completed', $payment->status);
        $this->assertSame('SGH555555', $payment->gateway_receipt);
        $this->assertSame('confirmed', $booking->fresh()->status);
        $this->assertEquals(1500, $booking->fresh()->amount_paid);
        Notification::assertSentTo($fan, BookingPaidNotification::class);

        // The page no longer offers "check your phone".
        $props = $this->actingAs($fan)->get(route('fan.bookings.show', $booking))
            ->viewData('page')['props'];
        $this->assertNull($props['mpesaAttempt']);
        $this->assertSame('confirmed', $props['booking']['status']);
    }

    public function test_a_fresh_pending_prompt_is_offered_to_the_page_for_polling(): void
    {
        $this->configureMpesa();
        $fan = User::factory()->create();
        $booking = $this->booking($fan);
        $this->pendingPayment($booking);

        $this->actingAs($fan)->get(route('fan.bookings.show', $booking))->assertOk();

        $props = $this->actingAs($fan)->get(route('fan.bookings.show', $booking))
            ->viewData('page')['props'];
        $this->assertSame('pending', $props['mpesaAttempt']['status']);
        $this->assertTrue($props['mpesaDirect']);
        $this->assertSame('pending_payment', $props['booking']['status']);
    }

    // ── The rails stay independent ────────────────────────────────────────

    public function test_without_daraja_keys_the_hosted_paystack_path_still_takes_mpessa(): void
    {
        // No services.mpesa.* configured — method=mpesa must fall through to
        // Sprint 66's hosted mobile_money checkout, exactly as before.
        config(['services.paystack.secret' => 'sk_test_x', 'services.paystack.kes_per_usd' => 130]);
        $this->stubDaraja([
            'https://api.paystack.co/transaction/initialize' => Http::response(['data' => ['authorization_url' => 'https://checkout.paystack.com/m']]),
        ]);
        $fan = User::factory()->create();
        $booking = $this->booking($fan);

        $this->actingAs($fan)->post(route('fan.bookings.pay', $booking), [
            'method' => 'mpesa',
            'phone' => '0712345678',
        ], ['X-Inertia' => 'true'])->assertStatus(409);

        Http::assertSent(fn ($r) => str_contains($r->url(), 'initialize')
            && $r['currency'] === 'KES' && $r['channels'] === ['mobile_money']);
        $this->assertSame('pending', Payment::first()->status);
        $this->assertNull(Payment::first()->gateway_reference);
    }
}
