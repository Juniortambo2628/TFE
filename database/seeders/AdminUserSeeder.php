<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if admin exists
        $admin = User::firstOrCreate(
            ['email' => 'admin@tfe.com'],
            [
                'name' => 'System Admin',
                'password' => Hash::make('password'), // Change in production
                'email_verified_at' => now(),
                'is_admin' => true,
                'is_partner' => false,
                'phone' => '1234567890',
                'country' => 'Kenya',
                'first_name' => 'System',
                'last_name' => 'Admin',
            ]
        );

        if (! $admin->is_admin) {
            $admin->update(['is_admin' => true]);
        }
    }
}
