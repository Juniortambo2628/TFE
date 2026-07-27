<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        if (config('database.default') !== 'sqlite') {
            DB::statement("ALTER TABLE payment_transactions MODIFY COLUMN method ENUM('mpesa', 'stripe', 'bank', 'wallet', 'paystack')");
        }
    }

    public function down(): void
    {
        if (config('database.default') !== 'sqlite') {
            DB::statement("ALTER TABLE payment_transactions MODIFY COLUMN method ENUM('mpesa', 'stripe', 'bank', 'wallet')");
        }
    }
};
