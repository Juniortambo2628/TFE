<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds missing columns to existing social tables and creates additional tables
     */
    public function up(): void
    {
        // Update posts table with missing columns
        Schema::table('posts', function (Blueprint $table) {
            if (!Schema::hasColumn('posts', 'visibility')) {
                $table->string('visibility')->default('public')->after('content');
            }
            if (!Schema::hasColumn('posts', 'comment_count')) {
                $table->unsignedInteger('comment_count')->default(0)->after('likes_count');
            }
            if (!Schema::hasColumn('posts', 'share_count')) {
                $table->unsignedInteger('share_count')->default(0)->after('comment_count');
            }
        });

        // Update tribes table with missing columns
        Schema::table('tribes', function (Blueprint $table) {
            if (!Schema::hasColumn('tribes', 'slug')) {
                $table->string('slug', 100)->nullable()->unique()->after('name');
            }
            if (!Schema::hasColumn('tribes', 'avatar')) {
                $table->string('avatar')->nullable()->after('description');
            }
            if (!Schema::hasColumn('tribes', 'banner')) {
                $table->string('banner')->nullable()->after('avatar');
            }
            if (!Schema::hasColumn('tribes', 'member_count')) {
                $table->unsignedInteger('member_count')->default(0)->after('created_by');
            }
            if (!Schema::hasColumn('tribes', 'posts_count')) {
                $table->unsignedInteger('posts_count')->default(0)->after('member_count');
            }
            if (!Schema::hasColumn('tribes', 'privacy')) {
                $table->string('privacy')->default('public')->after('posts_count');
            }
        });

        // Create post_likes table if not exists
        if (!Schema::hasTable('post_likes')) {
            Schema::create('post_likes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('post_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->timestamps();
                
                $table->unique(['post_id', 'user_id']);
            });
        }

        // Create post_comments table if not exists
        if (!Schema::hasTable('post_comments')) {
            Schema::create('post_comments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('post_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->text('content');
                $table->timestamps();
                
                $table->index(['post_id', 'created_at']);
            });
        }

        // Create follows table if not exists
        if (!Schema::hasTable('follows')) {
            Schema::create('follows', function (Blueprint $table) {
                $table->id();
                $table->foreignId('follower_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('following_id')->constrained('users')->onDelete('cascade');
                $table->timestamps();
                
                $table->unique(['follower_id', 'following_id']);
            });
        }

        // Create hashtags table if not exists
        if (!Schema::hasTable('hashtags')) {
            Schema::create('hashtags', function (Blueprint $table) {
                $table->id();
                $table->string('name', 100)->unique();
                $table->unsignedInteger('post_count')->default(0);
                $table->timestamps();
            });
        }

        // Create post_hashtags pivot table if not exists
        if (!Schema::hasTable('post_hashtags')) {
            Schema::create('post_hashtags', function (Blueprint $table) {
                $table->foreignId('post_id')->constrained()->onDelete('cascade');
                $table->foreignId('hashtag_id')->constrained()->onDelete('cascade');
                
                $table->primary(['post_id', 'hashtag_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_hashtags');
        Schema::dropIfExists('hashtags');
        Schema::dropIfExists('follows');
        Schema::dropIfExists('post_comments');
        Schema::dropIfExists('post_likes');
        
        // Remove added columns from posts
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['visibility', 'comment_count', 'share_count']);
        });
        
        // Remove added columns from tribes
        Schema::table('tribes', function (Blueprint $table) {
            $table->dropColumn(['slug', 'avatar', 'banner', 'member_count', 'posts_count', 'privacy']);
        });
    }
};
