<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Join requests for tribes whose privacy is not "public".
 *
 * The create-tribe form has always offered "Private (Approval required)" and
 * "Invite Only", but nothing implemented either: TribeController::join()
 * added the member straight away regardless of privacy, so a private tribe was
 * private in label only. This table is the missing half — a private tribe now
 * collects requests that its admins approve or reject.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tribe_join_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tribe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('message', 500)->nullable();
            $table->string('status')->default('pending'); // pending | approved | rejected
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();

            // One live request per fan per tribe. A rejected request is updated
            // in place when the fan asks again, rather than stacking rows.
            $table->unique(['tribe_id', 'user_id']);
            $table->index(['tribe_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tribe_join_requests');
    }
};
