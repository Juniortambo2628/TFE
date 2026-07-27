<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->index('budget_id');
            $table->index('tribe_id');
            $table->index('share_id');

            $table->foreign('tribe_id')
                ->references('id')
                ->on('tribes')
                ->onDelete('set null');
        });

        Schema::table('webauthn_credentials', function (Blueprint $table) {
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['tribe_id']);
            $table->dropIndex(['budget_id']);
            $table->dropIndex(['tribe_id']);
            $table->dropIndex(['share_id']);
        });

        Schema::table('webauthn_credentials', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });
    }
};
