<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sprint 47 Phase D — slim the users row to auth + identity only.
 *
 * TFE doesn't do KYC. Country, phone, date-of-birth and company address
 * belong on the partner platform that services the fan (or on the partner's
 * own PartnerProfile record, which already carries contact_phone /
 * contact_email / website_url for public contact info). Dropping them
 * shrinks our liability + our storage.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['phone', 'country', 'country_code', 'date_of_birth', 'company_address'] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable();
            $table->string('country')->nullable();
            $table->string('country_code')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->text('company_address')->nullable();
        });
    }
};
