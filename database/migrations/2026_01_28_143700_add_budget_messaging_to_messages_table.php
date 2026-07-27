<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds budget_id and sender_type columns to messages table for partner-fan communication
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->unsignedBigInteger('budget_id')->nullable()->after('tribe_id');
            $table->string('sender_type')->nullable()->after('budget_id'); // 'partner' or 'fan'

            $table->foreign('budget_id')
                ->references('id')
                ->on('budgets')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['budget_id']);
            $table->dropColumn(['budget_id', 'sender_type']);
        });
    }
};
