<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sprint 66 — opt-in SMS / WhatsApp alerts.
 *
 * Deliberately NOT a `users.phone` column: Sprint 47 dropped phone from users
 * to keep TFE out of KYC. This holds one number per fan, used ONLY to send
 * the alerts they asked for, with the consent time on the row. Deleting the
 * row (the "Stop texts" button) removes the number entirely.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('phone', 20);             // E.164, e.g. +254712345678
            $table->string('channel', 16)->default('sms'); // sms | whatsapp
            $table->timestamp('consented_at');
            $table->timestamp('verified_at')->nullable();
            $table->string('otp_hash')->nullable();
            $table->timestamp('otp_expires_at')->nullable();
            $table->unsignedTinyInteger('otp_attempts')->default(0);
            $table->timestamps();
        });

        Schema::table('bookings', function (Blueprint $table) {
            // So the "hold expiring" reminder goes once, not every hour.
            $table->timestamp('hold_reminded_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_contacts');
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('hold_reminded_at');
        });
    }
};
