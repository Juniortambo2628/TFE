<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Announcements table for admin broadcasts
        if (! Schema::hasTable('announcements')) {
            Schema::create('announcements', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('content');
                $table->enum('type', ['info', 'warning', 'success', 'danger'])->default('info');
                $table->boolean('is_active')->default(true);
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
            });
        }

        // Event RSVPs
        if (! Schema::hasTable('event_rsvps')) {
            Schema::create('event_rsvps', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('event_id')->constrained()->onDelete('cascade');
                $table->enum('status', ['attending', 'maybe', 'not_attending'])->default('attending');
                $table->timestamps();
                $table->unique(['user_id', 'event_id']);
            });
        }

        // Payment methods
        if (! Schema::hasTable('payment_methods')) {
            Schema::create('payment_methods', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->enum('type', ['mpesa', 'card', 'bank']);
                $table->string('phone_number')->nullable(); // For M-Pesa
                $table->string('card_last_four')->nullable();
                $table->string('card_brand')->nullable();
                $table->string('stripe_payment_method_id')->nullable();
                $table->boolean('is_default')->default(false);
                $table->timestamps();
            });
        }

        // Payment transactions (enhanced)
        if (! Schema::hasTable('payment_transactions')) {
            Schema::create('payment_transactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->decimal('amount', 12, 2);
                $table->string('currency')->default('KES');
                $table->enum('type', ['deposit', 'payment', 'refund', 'transfer']);
                $table->enum('method', ['mpesa', 'stripe', 'bank', 'wallet']);
                $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])->default('pending');
                $table->string('reference')->unique();
                $table->string('mpesa_receipt')->nullable();
                $table->string('stripe_payment_intent')->nullable();
                $table->text('description')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();
            });
        }

        // User security settings
        if (! Schema::hasTable('user_security_settings')) {
            Schema::create('user_security_settings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->boolean('two_factor_enabled')->default(false);
                $table->string('two_factor_secret')->nullable();
                $table->text('two_factor_recovery_codes')->nullable();
                $table->boolean('login_notifications')->default(true);
                $table->timestamp('last_password_change')->nullable();
                $table->timestamps();
            });
        }

        // Login history
        if (! Schema::hasTable('login_history')) {
            Schema::create('login_history', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('ip_address');
                $table->string('user_agent')->nullable();
                $table->string('device')->nullable();
                $table->string('location')->nullable();
                $table->boolean('successful')->default(true);
                $table->timestamps();
            });
        }

        // Tribe posts (discussions within tribes)
        if (! Schema::hasTable('tribe_posts')) {
            Schema::create('tribe_posts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tribe_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('title')->nullable();
                $table->text('content');
                $table->boolean('is_pinned')->default(false);
                $table->integer('view_count')->default(0);
                $table->timestamps();
            });
        }

        // Tribe post replies
        if (! Schema::hasTable('tribe_post_replies')) {
            Schema::create('tribe_post_replies', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tribe_post_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->text('content');
                $table->timestamps();
            });
        }

        // Favorite matches
        if (! Schema::hasTable('favorite_matches')) {
            Schema::create('favorite_matches', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('fixture_id')->constrained()->onDelete('cascade');
                $table->timestamps();
                $table->unique(['user_id', 'fixture_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('favorite_matches');
        Schema::dropIfExists('tribe_post_replies');
        Schema::dropIfExists('tribe_posts');
        Schema::dropIfExists('login_history');
        Schema::dropIfExists('user_security_settings');
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('payment_methods');
        Schema::dropIfExists('event_rsvps');
        Schema::dropIfExists('announcements');
    }
};
