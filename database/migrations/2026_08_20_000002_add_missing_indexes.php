<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('parent_post_id');
        });

        Schema::table('follows', function (Blueprint $table) {
            $table->index('following_id');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->index('sender_id');
            $table->index('user_id');
        });

        Schema::table('post_comments', function (Blueprint $table) {
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['parent_post_id']);
        });

        Schema::table('follows', function (Blueprint $table) {
            $table->dropIndex(['following_id']);
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['sender_id']);
            $table->dropIndex(['user_id']);
        });

        Schema::table('post_comments', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });
    }
};
