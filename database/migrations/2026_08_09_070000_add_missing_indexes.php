<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->index('transaction_id');
        });

        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->index('reference');
        });

        Schema::table('loan_applications', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('contact_submissions', function (Blueprint $table) {
            $table->index('is_read');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['transaction_id']);
        });

        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['reference']);
        });

        Schema::table('loan_applications', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('contact_submissions', function (Blueprint $table) {
            $table->dropIndex(['is_read']);
        });
    }
};
