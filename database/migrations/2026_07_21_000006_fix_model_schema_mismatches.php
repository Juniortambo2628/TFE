<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // PaymentSchedule: add missing columns that model expects
        Schema::table('payment_schedules', function (Blueprint $table) {
            $table->foreignId('booking_id')->nullable()->after('user_id')->constrained()->onDelete('set null');
            $table->string('payment_number')->nullable()->after('description');
            $table->date('paid_date')->nullable()->after('status');
        });

        // SavingsGoal: add budget_id that model expects
        Schema::table('savings_goals', function (Blueprint $table) {
            $table->foreignId('budget_id')->nullable()->after('user_id')->constrained()->onDelete('set null');
        });

        // LoanApplication: add columns that model expects
        Schema::table('loan_applications', function (Blueprint $table) {
            $table->foreignId('budget_id')->nullable()->after('user_id')->constrained()->onDelete('set null');
            $table->decimal('interest_rate', 5, 2)->nullable()->after('status');
        });

        // Transaction: add savings_goal_id that model expects
        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('savings_goal_id')->nullable()->after('user_id')->constrained()->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('payment_schedules', function (Blueprint $table) {
            $table->dropForeign(['booking_id']);
            $table->dropColumn(['booking_id', 'payment_number', 'paid_date']);
        });

        Schema::table('savings_goals', function (Blueprint $table) {
            $table->dropForeign(['budget_id']);
            $table->dropColumn('budget_id');
        });

        Schema::table('loan_applications', function (Blueprint $table) {
            $table->dropForeign(['budget_id']);
            $table->dropColumn(['budget_id', 'interest_rate']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['savings_goal_id']);
            $table->dropColumn('savings_goal_id');
        });
    }
};
