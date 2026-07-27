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
        Schema::table('stories', function (Blueprint $table) {
            if (!Schema::hasColumn('stories', 'linked_story_id')) {
                $table->foreignId('linked_story_id')->nullable()->after('user_id')->constrained('stories')->onDelete('set null');
            }
        });

        Schema::create('story_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('story_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('content');
            $table->timestamps();
            
            $table->index('story_id');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('story_replies');
        
        Schema::table('stories', function (Blueprint $table) {
            if (Schema::hasColumn('stories', 'linked_story_id')) {
                $table->dropForeign(['linked_story_id']);
                $table->dropColumn('linked_story_id');
            }
        });
    }
};
