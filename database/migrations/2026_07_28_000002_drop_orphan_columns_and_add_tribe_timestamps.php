<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['service_type', 'provider_name', 'cost', 'details']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('privacy_policy_agreed');
        });

        Schema::table('tribe_members', function (Blueprint $table) {
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('service_type')->nullable()->after('user_id');
            $table->string('provider_name')->nullable()->after('service_type');
            $table->decimal('cost', 10, 2)->nullable()->after('provider_name');
            $table->json('details')->nullable()->after('cost');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('privacy_policy_agreed')->default(false);
        });

        Schema::table('tribe_members', function (Blueprint $table) {
            $table->dropTimestamps();
        });
    }
};
