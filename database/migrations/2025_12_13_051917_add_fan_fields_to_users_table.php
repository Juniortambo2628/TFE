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
            // Personal Info
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('country')->nullable();
            $table->string('phone')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('country_code')->nullable();

            // Preferences
            $table->string('team_support')->nullable();

            // Financial Profile
            $table->boolean('seeking_financing')->default(false);
            $table->string('employment_status')->nullable();
            $table->string('loan_return_period')->nullable();
            $table->boolean('banking_partners_consent')->default(false);

            // Consents
            $table->boolean('marketing_consent')->default(false);
            $table->boolean('terms_agreed')->default(false);
            $table->boolean('privacy_policy_agreed')->default(false);

            // System
            $table->boolean('registration_completed')->default(false);
            $table->string('status')->default('active'); // active, pending, suspended
            $table->boolean('two_factor_enabled')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'first_name', 'last_name', 'country', 'phone', 'date_of_birth', 'country_code',
                'team_support', 'seeking_financing', 'employment_status', 'loan_return_period',
                'banking_partners_consent', 'marketing_consent', 'terms_agreed', 'privacy_policy_agreed',
                'registration_completed', 'status', 'two_factor_enabled',
            ]);
        });
    }
};
