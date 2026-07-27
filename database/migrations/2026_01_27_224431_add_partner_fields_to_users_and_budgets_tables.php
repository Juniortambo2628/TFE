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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_partner')->default(false)->after('password');
        });

        Schema::table('budgets', function (Blueprint $table) {
            $table->enum('partner_status', ['pending', 'approved', 'modified'])->default('pending')->after('is_active');
            $table->decimal('partner_cost', 10, 2)->nullable()->after('partner_status');
            $table->json('partner_breakdown')->nullable()->after('partner_cost');
            $table->text('partner_notes')->nullable()->after('partner_breakdown');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_partner');
        });

        Schema::table('budgets', function (Blueprint $table) {
            $table->dropColumn(['partner_status', 'partner_cost', 'partner_breakdown', 'partner_notes']);
        });
    }
};
