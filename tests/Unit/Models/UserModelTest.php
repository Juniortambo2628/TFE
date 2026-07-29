<?php

namespace Tests\Unit\Models;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_has_fillable_attributes(): void
    {
        $user = User::factory()->create();

        $this->assertContains('name', $user->getFillable());
        $this->assertContains('email', $user->getFillable());
        $this->assertContains('is_admin', $user->getFillable());
        $this->assertContains('is_partner', $user->getFillable());
        $this->assertContains('phone', $user->getFillable());
        $this->assertContains('country', $user->getFillable());
        $this->assertContains('avatar', $user->getFillable());
        $this->assertContains('cover_image', $user->getFillable());
    }

    public function test_user_has_hidden_attributes(): void
    {
        $user = User::factory()->create();

        $hidden = $user->getHidden();
        $this->assertContains('password', $hidden);
    }

    public function test_user_can_be_admin(): void
    {
        $user = User::factory()->admin()->create();

        $this->assertTrue($user->is_admin);
    }

    public function test_user_can_be_partner(): void
    {
        $user = User::factory()->partner()->create();

        $this->assertTrue($user->is_partner);
    }

    public function test_user_defaults_to_not_admin(): void
    {
        $user = User::factory()->create();

        $this->assertFalse((bool) $user->is_admin);
    }

    public function test_user_defaults_to_not_partner(): void
    {
        $user = User::factory()->create();

        $this->assertFalse((bool) $user->is_partner);
    }

    public function test_user_factory_creates_valid_user(): void
    {
        $user = User::factory()->create();

        $this->assertNotNull($user->id);
        $this->assertNotNull($user->name);
        $this->assertNotNull($user->email);
        $this->assertNotNull($user->password);
        $this->assertNotNull($user->email_verified_at);
    }

    public function test_user_can_be_created_with_specific_fields(): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '+254700000000',
            'country' => 'Kenya',
        ]);

        $this->assertEquals('Test User', $user->name);
        $this->assertEquals('test@example.com', $user->email);
        $this->assertEquals('+254700000000', $user->phone);
        $this->assertEquals('Kenya', $user->country);
    }

    public function test_user_has_correct_casts(): void
    {
        $user = User::factory()->create();

        $casts = $user->getCasts();
        $this->assertArrayHasKey('email_verified_at', $casts);
        $this->assertArrayHasKey('password', $casts);
    }

    public function test_user_implements_must_verify_email(): void
    {
        $user = User::factory()->create();

        $this->assertInstanceOf(\Illuminate\Contracts\Auth\MustVerifyEmail::class, $user);
    }
}
