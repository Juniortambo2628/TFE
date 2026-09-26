<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('virtual_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->foreignId('partner_id')->constrained('users')->cascadeOnDelete();
            $table->string('holder_name');
            $table->string('pan', 19);
            $table->string('last4', 4);
            $table->string('expiry', 5);
            $table->string('cvv', 4);
            $table->string('network')->default('visa');
            $table->string('status')->default('active');
            $table->json('balances');
            $table->timestamps();

            $table->index('partner_id');
        });

        Schema::create('virtual_card_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('virtual_card_id')->constrained('virtual_cards')->cascadeOnDelete();
            $table->string('kind')->default('debit'); // debit | credit
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3);
            $table->string('merchant');
            $table->string('category')->nullable();
            $table->string('reference')->nullable();
            $table->timestamp('posted_at');
            $table->timestamps();

            $table->index(['virtual_card_id', 'posted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('virtual_card_transactions');
        Schema::dropIfExists('virtual_cards');
    }
};
