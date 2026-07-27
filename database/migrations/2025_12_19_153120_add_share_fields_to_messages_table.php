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
        Schema::table('messages', function (Blueprint $table) {
            if (! Schema::hasColumn('messages', 'share_type')) {
                $table->string('share_type')->nullable()->after('body'); // 'post' or 'story'
            }
            if (! Schema::hasColumn('messages', 'share_id')) {
                $table->unsignedBigInteger('share_id')->nullable()->after('share_type');
            }
            if (! Schema::hasColumn('messages', 'tribe_id')) {
                $table->unsignedBigInteger('tribe_id')->nullable()->after('share_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            if (Schema::hasColumn('messages', 'tribe_id')) {
                $table->dropColumn('tribe_id');
            }
            if (Schema::hasColumn('messages', 'share_id')) {
                $table->dropColumn('share_id');
            }
            if (Schema::hasColumn('messages', 'share_type')) {
                $table->dropColumn('share_type');
            }
        });
    }
};
