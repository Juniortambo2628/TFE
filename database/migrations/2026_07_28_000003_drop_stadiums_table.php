<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('stadiums');
    }

    public function down(): void
    {
        Schema::create('stadiums', function ($table) {
            $table->id();
            $table->string('official_name')->unique();
            $table->string('city');
            $table->string('country');
            $table->integer('capacity');
            $table->string('image')->nullable();
            $table->timestamps();
        });
    }
};
