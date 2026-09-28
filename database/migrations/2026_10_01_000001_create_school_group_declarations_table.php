<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A school's declaration against a group request.
 *
 * TFE's engagement for a school trip is with the SCHOOL, through an
 * appointed official — not with each child's guardian. The school already
 * runs parental consent, safeguarding and duty of care, and rebuilding any
 * of that here would be a worse copy of a process that already works.
 *
 * So no pupil is a record on this platform. What TFE stores is the
 * warranty that the school's own channels were followed, who warranted it,
 * and the party composition a partner needs in order to plan — and nothing
 * else. Data never collected cannot be breached, misused or requested.
 *
 * Its own table rather than ten mostly-null columns on `budgets`: a
 * declaration is a distinct record with its own lifetime, and the vast
 * majority of budgets are one fan planning their own trip.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_group_declarations', function (Blueprint $table) {
            $table->id();

            // One declaration per request. Unique, not just indexed — two
            // declarations against one budget would make "what was agreed"
            // unanswerable, which is the whole point of holding it.
            $table->foreignId('budget_id')->unique()->constrained()->cascadeOnDelete();

            $table->string('school_name');

            // A named person with a role, at an official school address.
            // "The school agreed" cannot be resolved against in a dispute;
            // "Jane Mwangi, Deputy Head" can.
            $table->string('official_name');
            $table->string('official_role');
            $table->string('official_email');
            $table->string('official_phone')->nullable();

            // Split on purpose. "40 travellers" drives nothing; adults and
            // minors separately drive supervision ratios, room configuration
            // and an airline's own minor policy.
            $table->unsignedSmallInteger('travellers_adults')->default(0);
            $table->unsignedSmallInteger('travellers_minors')->default(0);
            // What decides whether unaccompanied-minor handling applies —
            // and still nobody's identity.
            $table->unsignedTinyInteger('youngest_traveller_age')->nullable();

            // The two things the school warrants.
            $table->boolean('channels_confirmed')->default(false);
            $table->boolean('information_accurate')->default(false);

            // Its purpose is to still be here in two years.
            $table->timestamp('declared_at')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();

            // Partners filter their queue by "does this involve minors".
            $table->index('travellers_minors');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_group_declarations');
    }
};
