<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_assets', function (Blueprint $table) {
            $table->id();
            $table->string('disk')->default('public');
            $table->string('path');                 // storage-relative path, e.g. assets/uploads/x.webp
            $table->string('url');                  // public URL, e.g. /storage/assets/uploads/x.webp
            $table->string('name');                 // original filename
            $table->string('mime')->nullable();
            $table->string('kind')->default('image'); // image | video
            $table->unsignedBigInteger('size')->default(0); // bytes, post-optimization
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('kind');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_assets');
    }
};
