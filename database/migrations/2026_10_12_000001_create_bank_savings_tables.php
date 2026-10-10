<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sprint 67 — saving for a trip with a bank partner (prototype).
 *
 * `bank_savings_links` is EVERYTHING TFE keeps: which bank, an opaque account
 * reference (encrypted at rest), the goal it is for, and the fan's consent.
 * No balance, no transaction, no account number — those live at the bank and
 * are fetched live, behind a fresh password check, every time they are shown.
 *
 * The two `sandbox_bank_*` tables are NOT TFE data. They are the simulated
 * bank's own ledger, used only by SandboxBankProvider so the prototype works
 * before a real bank is signed. Drop them when the first real adapter lands.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_savings_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('savings_goal_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('partner_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('provider', 32);
            $table->text('external_ref')->nullable();   // encrypted cast
            $table->string('status', 16)->default('pending'); // pending | active
            $table->json('consent_scopes');
            $table->timestamp('consented_at');
            $table->timestamps();
            $table->unique(['user_id', 'savings_goal_id']);
        });

        Schema::create('sandbox_bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->uuid('ref')->unique();
            $table->string('holder_name');
            $table->timestamps();
        });

        Schema::create('sandbox_bank_transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('account_ref')->index();
            $table->string('reference')->unique();
            $table->string('type', 16);     // deposit | payment
            $table->decimal('amount', 12, 2); // signed: deposits +, payments -
            $table->string('currency', 3);
            $table->string('description');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sandbox_bank_transactions');
        Schema::dropIfExists('sandbox_bank_accounts');
        Schema::dropIfExists('bank_savings_links');
    }
};
