<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Web push opt-ins (Nov 2026): one row per browser / installed app a person
 * turned alerts on in. The endpoint is a capability URL (whoever holds it can
 * wake that device), so it is never sent back to the client.
 *
 * Pushes carry no payload (WebPushService), so p256dh/auth are kept only so a
 * later payload version needs no re-subscription.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('endpoint');
            $table->char('endpoint_hash', 64)->unique();
            $table->string('p256dh', 255)->nullable();
            $table->string('auth', 255)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('last_pushed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
