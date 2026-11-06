<?php

namespace Tests\Feature;

use App\Models\PushSubscription;
use App\Models\User;
use App\Notifications\Channels\WebPushChannel;
use App\Services\WebPushService;
use App\Support\WebPush\Vapid;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\Client\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

/** Web push (Nov 2026): opt-in, scoping, the empty push and what it shows. */
class WebPushTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc123';

    protected function setUp(): void
    {
        parent::setUp();
        $keys = Vapid::generate();
        config(['webpush.public_key' => $keys['public'], 'webpush.private_key' => $keys['private']]);
    }

    private function subscribe(User $user, string $endpoint = self::ENDPOINT)
    {
        return $this->actingAs($user)->postJson(route('push.subscriptions.store'), [
            'endpoint' => $endpoint,
            'keys' => ['p256dh' => 'BKey', 'auth' => 'auth'],
        ]);
    }

    public function test_a_signed_in_person_can_subscribe_and_unsubscribe_a_device(): void
    {
        $user = User::factory()->create();
        $this->subscribe($user)->assertOk();
        $this->assertDatabaseHas('push_subscriptions', ['user_id' => $user->id, 'endpoint_hash' => PushSubscription::hashFor(self::ENDPOINT)]);

        // Subscribing the same device twice keeps one row.
        $this->subscribe($user)->assertOk();
        $this->assertSame(1, PushSubscription::count());

        $this->actingAs($user)->deleteJson(route('push.subscriptions.destroy'), ['endpoint' => self::ENDPOINT])->assertOk();
        $this->assertSame(0, PushSubscription::count());
    }

    public function test_a_guest_cannot_subscribe_and_plain_http_endpoints_are_refused(): void
    {
        $this->postJson(route('push.subscriptions.store'), ['endpoint' => self::ENDPOINT])->assertUnauthorized();
        $this->subscribe(User::factory()->create(), 'http://example.com/push')->assertUnprocessable();
    }

    public function test_one_person_cannot_remove_anothers_device(): void
    {
        $owner = User::factory()->create();
        $this->subscribe($owner)->assertOk();

        $this->actingAs(User::factory()->create())
            ->deleteJson(route('push.subscriptions.destroy'), ['endpoint' => self::ENDPOINT])->assertOk();
        $this->assertSame(1, PushSubscription::count());
    }

    public function test_a_device_moves_to_whoever_signs_in_on_it(): void
    {
        $first = User::factory()->create();
        $second = User::factory()->create();
        $this->subscribe($first);
        $this->subscribe($second);

        $this->assertSame([$second->id], PushSubscription::pluck('user_id')->all());
    }

    public function test_subscribing_is_refused_when_push_is_not_configured(): void
    {
        config(['webpush.private_key' => null]);
        $this->subscribe(User::factory()->create())->assertNotFound();
    }

    public function test_the_key_is_shared_only_when_configured_and_signed_in(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->get('/')->assertInertia(fn ($page) => $page->where('webPushKey', config('webpush.public_key')));

        config(['webpush.public_key' => null]);
        $this->actingAs($user)->get('/')->assertInertia(fn ($page) => $page->where('webPushKey', null));
    }

    public function test_the_push_is_empty_and_signed_with_vapid(): void
    {
        Http::swap(new Factory);
        Http::fake([self::ENDPOINT => Http::response('', 201)]);
        $user = User::factory()->create();
        $this->subscribe($user);

        $this->assertSame(1, app(WebPushService::class)->wake($user));

        Http::assertSent(function (Request $request) {
            [$jwt, $key] = $this->parseAuth($request->header('Authorization')[0]);
            [$h, $p, $sig] = explode('.', $jwt);
            $claims = json_decode(Vapid::b64urlDecode($p), true);

            return $request->url() === self::ENDPOINT
                && $request->body() === ''
                && $key === config('webpush.public_key')
                && $claims['aud'] === 'https://fcm.googleapis.com'
                && $claims['exp'] > time()
                && openssl_verify("$h.$p", Vapid::rawToDer(Vapid::b64urlDecode($sig)), Vapid::publicPem($key), OPENSSL_ALGO_SHA256) === 1;
        });
        $this->assertNotNull(PushSubscription::first()->last_pushed_at);
    }

    public function test_a_gone_subscription_is_deleted(): void
    {
        Http::swap(new Factory);
        Http::fake([self::ENDPOINT => Http::response('', 410)]);
        $user = User::factory()->create();
        $this->subscribe($user);

        $this->assertSame(0, app(WebPushService::class)->wake($user));
        $this->assertSame(0, PushSubscription::count());
    }

    public function test_the_channel_wakes_the_notifiables_devices(): void
    {
        Http::swap(new Factory);
        Http::fake([self::ENDPOINT => Http::response('', 201)]);
        $user = User::factory()->create();
        $this->subscribe($user);

        app(WebPushChannel::class)->send($user, new Notification);
        Http::assertSentCount(1);
    }

    public function test_latest_returns_the_newest_unread_notification_through_open(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->getJson(route('push.latest'))->assertOk()->assertJson(['notification' => null]);

        $n = DatabaseNotification::create([
            'id' => (string) Str::uuid(),
            'type' => 'App\\Notifications\\BookingPaidNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'data' => ['title' => 'Payment received', 'body' => 'Your booking is paid.', 'action_url' => '/fan/journey'],
        ]);

        $this->actingAs($user)->getJson(route('push.latest'))
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonPath('notification.title', 'Payment received')
            ->assertJsonPath('notification.url', route('notifications.open', $n->id, false))
            ->assertJsonPath('notification.unread', 1);

        // Someone else's push never shows it.
        $this->actingAs(User::factory()->create())->getJson(route('push.latest'))->assertJson(['notification' => null]);
    }

    public function test_the_command_prints_a_working_key_pair(): void
    {
        $this->artisan('webpush:vapid')->expectsOutputToContain('WEBPUSH_VAPID_PUBLIC_KEY=')->assertSuccessful();

        $keys = Vapid::generate();
        $this->assertSame(65, strlen(Vapid::b64urlDecode($keys['public'])));
        $this->assertSame(32, strlen(Vapid::b64urlDecode($keys['private'])));
    }

    private function parseAuth(string $header): array
    {
        preg_match('/^vapid t=([^,]+), k=(.+)$/', $header, $m);

        return [$m[1], $m[2]];
    }
}
