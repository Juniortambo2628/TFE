<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Institutions as a first-class ACCOUNT type (Sprint 62).
 *
 * A school taking forty pupils to AFCON is neither a fan nor a partner. It
 * does not publish inventory — so `partner_type = school_community`, which
 * belongs to the organisations that RUN programmes, is the wrong shelf for
 * it. It is a buyer whose buyer is an organisation.
 *
 * Until now such an account was an ordinary fan row, which meant the school
 * signed up as a person, planned as a person, and only became an institution
 * at the moment it filled in a declaration. `account_type` makes it true from
 * the sign-up form onward, and is what every group surface scopes on.
 *
 * Note what is NOT here, and never will be: anything about a pupil. The
 * institution is the account; the travellers are counts on a declaration.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 'individual' | 'institution'. Defaulted, so every existing row
            // is an individual without a backfill.
            $table->string('account_type', 20)->default('individual')->after('is_partner');
        });

        Schema::create('institution_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();

            $table->string('institution_name');
            // One of InstitutionProfile::TYPES — a school and a community
            // football club run very different consent regimes, and a partner
            // quoting for them needs to know which it is looking at.
            $table->string('institution_type', 32);
            // The registration a school actually holds with its ministry or
            // authority. Nullable because a community group may have none,
            // and a field that forces an invention is worse than no field.
            $table->string('registration_number')->nullable();

            $table->string('country');
            $table->string('city')->nullable();
            $table->text('address')->nullable();

            // The role of the person who signed the account up. Their name
            // and email live on `users` — one place, not two.
            $table->string('official_role', 120);
            $table->string('contact_phone', 40)->nullable();

            // TFE verifies the institution once, rather than re-checking its
            // authority on every trip. Same vocabulary as partner accounts.
            $table->string('verification_status', 20)->default('pending');
            $table->timestamp('verified_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('institution_profiles');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('account_type');
        });
    }
};
