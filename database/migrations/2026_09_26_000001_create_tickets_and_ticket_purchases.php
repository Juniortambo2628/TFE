<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('tournament_id');
            $table->foreignId('partner_id')->constrained('users')->cascadeOnDelete();
            $table->string('home_team');
            $table->string('home_team_code', 3)->nullable();
            $table->string('away_team');
            $table->string('away_team_code', 3)->nullable();
            $table->string('venue_slug');
            $table->string('venue_name');
            $table->string('venue_city');
            $table->string('venue_country');
            $table->unsignedInteger('venue_capacity');
            $table->string('stage')->default('Group Stage');
            $table->timestamp('kickoff_at');
            $table->decimal('price', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->unsignedInteger('capacity');
            $table->unsignedInteger('sold')->default(0);
            $table->string('hero_image')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tournament_id', 'kickoff_at']);
            $table->index('partner_id');
        });

        Schema::create('ticket_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('reference')->unique();
            $table->string('status')->default('confirmed');
            $table->string('paid_with')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['ticket_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_purchases');
        Schema::dropIfExists('tickets');
    }
};
