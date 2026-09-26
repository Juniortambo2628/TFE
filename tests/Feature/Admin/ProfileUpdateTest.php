<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Sprint 56 — the admin profile saves what it shows.
 *
 * It did not. "Phone Number" was a field with no `users.phone` column behind
 * it and no mention in the controller, so an admin typed a number, saved, and
 * found it blank — the same silent discard as the fan's Bio. The field is
 * gone (nothing on the platform reads a user phone number). In its place the
 * admin can finally set an avatar, which both other roles could all along.
 */
class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    public function test_admin_can_update_their_name_and_email(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->put(route('admin.profile.update'), [
                'name' => 'TFE Control Room',
                'email' => 'control@tfe.com',
            ])
            ->assertRedirect();

        $fresh = $admin->fresh();
        $this->assertSame('TFE Control Room', $fresh->name);
        $this->assertSame('control@tfe.com', $fresh->email);
        $this->assertNull($fresh->email_verified_at, 'A new address must be re-verified.');
    }

    public function test_admin_can_upload_an_avatar(): void
    {
        Storage::fake('public');
        $admin = $this->admin();

        $this->actingAs($admin)
            ->put(route('admin.profile.update'), [
                'name' => $admin->name,
                'email' => $admin->email,
                'avatar_file' => UploadedFile::fake()->image('me.jpg', 400, 400),
            ])
            ->assertRedirect();

        $this->assertNotNull($admin->fresh()->avatar, 'The upload must be stored on the user.');
    }

    public function test_clearing_the_avatar_sticks(): void
    {
        $admin = $this->admin();
        $admin->update(['avatar' => '/storage/avatars/old.png']);

        $this->actingAs($admin)
            ->put(route('admin.profile.update'), [
                'name' => $admin->name,
                'email' => $admin->email,
                'avatar' => '',
            ])
            ->assertRedirect();

        $this->assertNull($admin->fresh()->avatar, 'A cleared avatar must stay cleared.');
    }

    public function test_an_avatar_the_form_does_not_send_is_left_alone(): void
    {
        $admin = $this->admin();
        $admin->update(['avatar' => '/storage/avatars/old.png']);

        $this->actingAs($admin)
            ->put(route('admin.profile.update'), [
                'name' => 'Renamed',
                'email' => $admin->email,
            ])
            ->assertRedirect();

        $this->assertSame('/storage/avatars/old.png', $admin->fresh()->avatar);
    }

    public function test_the_profile_page_no_longer_carries_a_second_password_endpoint(): void
    {
        // Password changes belong to the one shared AccountSecurity surface
        // (Sprint 53). A duplicate endpoint on the profile controller is how
        // those two drift apart.
        $this->assertFalse(
            app('router')->has('admin.profile.password'),
            'admin.profile.password should be gone — use admin.security.password.'
        );
        $this->assertTrue(app('router')->has('admin.security.password'));
    }
}
