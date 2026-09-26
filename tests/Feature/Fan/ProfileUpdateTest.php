<?php

namespace Tests\Feature\Fan;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sprint 56 — the fan profile form's fields actually land.
 *
 * `bio` was the one that did not: the field was on the page and
 * `ProfileController::update()` validated it and handed it to
 * `$user->update()`, but `users` had no such column and `User::$fillable` no
 * such key, so Eloquent dropped it every time. The fan typed an about-you,
 * saved, and came back to an empty box.
 */
class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    private function createFan(): User
    {
        return User::factory()->create([
            'is_admin' => false,
            'is_partner' => false,
            'team_support' => 'Nigeria',
        ]);
    }

    public function test_fan_can_save_their_bio(): void
    {
        $fan = $this->createFan();

        $this->actingAs($fan)
            ->put(route('fan.profile.update'), [
                'name' => $fan->name,
                'team_support' => 'Nigeria',
                'bio' => 'Following the Super Eagles across East Africa.',
            ])
            ->assertRedirect();

        $this->assertSame(
            'Following the Super Eagles across East Africa.',
            $fan->fresh()->bio,
            'The bio field must persist — it is validated and shown back on the profile.'
        );
    }

    public function test_saved_bio_is_rendered_back_into_the_page(): void
    {
        $fan = $this->createFan();
        $fan->update(['bio' => 'Chipolopolo till I die.']);

        $props = $this->actingAs($fan)
            ->get(route('fan.profile'))
            ->viewData('page')['props'];

        $this->assertSame('Chipolopolo till I die.', $props['profile']['bio']);
    }

    public function test_fan_can_change_the_team_that_frames_their_avatar(): void
    {
        $fan = $this->createFan();

        $this->actingAs($fan)
            ->put(route('fan.profile.update'), [
                'name' => $fan->name,
                'team_support' => 'Zambia',
            ])
            ->assertRedirect();

        $this->assertSame('Zambia', $fan->fresh()->team_support);
    }
}
