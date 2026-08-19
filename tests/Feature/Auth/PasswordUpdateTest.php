<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/fan/profile')
            ->put('/password', [
                'current_password' => 'password',
                'password' => 'New-Pass1',
                'password_confirmation' => 'New-Pass1',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/fan/profile');

        $this->assertTrue(Hash::check('New-Pass1', $user->refresh()->password));
    }

    public function test_correct_password_must_be_provided_to_update_password(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/fan/profile')
            ->put('/password', [
                'current_password' => 'wrong-password',
                'password' => 'New-Pass1',
                'password_confirmation' => 'New-Pass1',
            ]);

        $response
            ->assertSessionHasErrors('current_password')
            ->assertRedirect('/fan/profile');
    }
}
