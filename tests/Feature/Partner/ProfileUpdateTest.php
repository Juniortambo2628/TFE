<?php

namespace Tests\Feature\Partner;

use App\Models\PartnerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 56 — a partner can edit their hub, including emptying a field.
 *
 * They could not before. `$validated['tagline'] ?? $branding->tagline` reads
 * a cleared field as absent, because ConvertEmptyStringsToNull turns '' into
 * null before validation — so the old text was written straight back and the
 * partner watched their deletion undo itself on every save.
 */
class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    private function partnerWithHub(): User
    {
        $user = User::factory()->partner()->create([
            'partner_type' => 'travel_agent',
            'company_name' => 'Serengeti Sports Travel Ltd.',
        ]);

        PartnerProfile::create([
            'user_id' => $user->id,
            'slug' => 'serengeti-sports-travel',
            'display_name' => 'Serengeti Sports Travel',
            'tagline' => 'Matchday, done right.',
            'about' => 'A decade of football-fan trips.',
            'website_url' => 'https://serengeti.example',
            'contact_email' => 'hello@serengeti.example',
            'contact_phone' => '+254700000000',
            'service_tags' => ['Flights', 'Hotels'],
            'is_public' => true,
        ]);

        return $user;
    }

    private function payload(User $user, array $overrides = []): array
    {
        return array_merge([
            'name' => $user->name,
            'display_name' => 'Serengeti Sports Travel',
            'is_public' => true,
        ], $overrides);
    }

    public function test_partner_can_clear_free_text_hub_fields(): void
    {
        $user = $this->partnerWithHub();

        $this->actingAs($user)
            ->post(route('partner.profile.update'), $this->payload($user, [
                'tagline' => '',
                'about' => '',
                'website_url' => '',
                'contact_phone' => '',
            ]))
            ->assertRedirect();

        $branding = $user->fresh()->partnerProfile;

        $this->assertNull($branding->tagline, 'A cleared tagline must stay cleared.');
        $this->assertNull($branding->about);
        $this->assertNull($branding->website_url);
        $this->assertNull($branding->contact_phone);
    }

    public function test_a_field_the_form_does_not_send_is_left_alone(): void
    {
        $user = $this->partnerWithHub();

        // No tagline key at all — a partial post must not wipe the hub.
        $this->actingAs($user)
            ->post(route('partner.profile.update'), $this->payload($user))
            ->assertRedirect();

        $this->assertSame('Matchday, done right.', $user->fresh()->partnerProfile->tagline);
    }

    public function test_display_name_falls_back_rather_than_clearing(): void
    {
        $user = $this->partnerWithHub();

        $this->actingAs($user)
            ->post(route('partner.profile.update'), $this->payload($user, ['display_name' => '']))
            ->assertRedirect();

        // A hub with no name renders as a blank card, so this one holds.
        $this->assertSame(
            'Serengeti Sports Travel',
            $user->fresh()->partnerProfile->display_name
        );
    }

    public function test_partner_can_update_their_hub_copy_and_visibility(): void
    {
        $user = $this->partnerWithHub();

        $this->actingAs($user)
            ->post(route('partner.profile.update'), $this->payload($user, [
                'tagline' => 'East Africa, end to end.',
                'service_tags' => ['Match tickets', 'Airport transfers'],
                'is_public' => false,
            ]))
            ->assertRedirect();

        $branding = $user->fresh()->partnerProfile;

        $this->assertSame('East Africa, end to end.', $branding->tagline);
        $this->assertSame(['Match tickets', 'Airport transfers'], $branding->service_tags);
        $this->assertFalse((bool) $branding->is_public);
    }
}
