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
        Schema::table('posts', function (Blueprint $table) {
            if (!Schema::hasColumn('posts', 'parent_post_id')) {
                $table->foreignId('parent_post_id')->nullable()->after('user_id')->constrained('posts')->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            if (Schema::hasColumn('posts', 'parent_post_id')) {
                $table->dropForeign(['parent_post_id']);
                $table->dropColumn('parent_post_id');
            }
        });
    }
};
