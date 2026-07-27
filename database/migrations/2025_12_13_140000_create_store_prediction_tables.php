<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Products table for Fan Store
        if (! Schema::hasTable('products')) {
            Schema::create('products', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('category');
                $table->decimal('price', 12, 2);
                $table->string('image')->nullable();
                $table->text('description')->nullable();
                $table->boolean('in_stock')->default(true);
                $table->integer('stock_quantity')->default(0);
                $table->timestamps();
            });
        }

        // World Cup Matches for Predictions
        if (! Schema::hasTable('world_cup_matches')) {
            Schema::create('world_cup_matches', function (Blueprint $table) {
                $table->id();
                $table->string('home_team');
                $table->string('away_team');
                $table->date('date');
                $table->time('time')->nullable();
                $table->string('stage'); // Group Stage, Round of 16, etc.
                $table->string('venue');
                $table->string('group_name')->nullable(); // Group A, B, etc.
                $table->integer('home_score')->nullable();
                $table->integer('away_score')->nullable();
                $table->enum('status', ['upcoming', 'open', 'live', 'completed', 'cancelled'])->default('upcoming');
                $table->datetime('prediction_deadline')->nullable();
                $table->timestamps();
            });
        }

        // Predictions table
        if (! Schema::hasTable('predictions')) {
            Schema::create('predictions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('match_id')->constrained('world_cup_matches')->onDelete('cascade');
                $table->integer('home_score');
                $table->integer('away_score');
                $table->integer('points_earned')->default(0);
                $table->boolean('is_correct')->default(false);
                $table->boolean('is_exact')->default(false);
                $table->timestamps();

                $table->unique(['user_id', 'match_id']);
            });
        }

        // Prizes table
        if (! Schema::hasTable('prizes')) {
            Schema::create('prizes', function (Blueprint $table) {
                $table->id();
                $table->string('position'); // 1st, 2nd, 3rd
                $table->string('name');
                $table->text('description')->nullable();
                $table->decimal('value', 12, 2)->default(0);
                $table->boolean('active')->default(true);
                $table->timestamps();
            });
        }

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('predictions');
        Schema::dropIfExists('prizes');
        Schema::dropIfExists('products');
        Schema::dropIfExists('world_cup_matches');
    }
};
