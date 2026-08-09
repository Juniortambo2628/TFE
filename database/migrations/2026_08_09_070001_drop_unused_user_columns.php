<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'seeking_financing',
                'employment_status',
                'loan_return_period',
                'banking_partners_consent',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('seeking_financing')->default(false);
            $table->string('employment_status')->nullable();
            $table->string('loan_return_period')->nullable();
            $table->boolean('banking_partners_consent')->default(false);
        });
    }
};
