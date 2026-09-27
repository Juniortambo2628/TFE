<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Learning resources — the coaching and safeguarding material behind the
 * Schools & Communities archetype.
 *
 * A resource is NOT a programme. The Coaches Education Programme is a
 * `Listing` of type `program` — a thing you enrol in, with a capacity, a
 * price and dates. Its four modules are resources: things you read or
 * watch. Putting them in `listings` would give every module a capacity and
 * a sell-through bar that mean nothing.
 *
 * `listing_id` is nullable so a resource can either stand alone (a
 * safeguarding policy every school should read) or belong to a programme
 * (that programme's modules).
 *
 * Publisher is polymorphic for the same reason `listings` is: admin-curated
 * and partner-authored rows live in one table, and `publisherSummary()`
 * already knows how to render either.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('learning_resources', function (Blueprint $table) {
            $table->id();

            $table->string('publisher_type')->nullable();
            $table->unsignedBigInteger('publisher_id')->nullable();
            $table->index(['publisher_type', 'publisher_id']);

            // The programme this is a module of, if any. nullOnDelete so
            // deleting a programme orphans its modules rather than silently
            // destroying material someone wrote.
            $table->foreignId('listing_id')->nullable()->constrained()->nullOnDelete();

            $table->string('title');
            $table->string('slug')->unique();
            $table->text('summary')->nullable();
            $table->longText('body')->nullable();

            // The two filters that matter. `audience` is what makes the same
            // library useful to a parent as well as a coach.
            $table->string('category', 32)->default('coaching')->index();
            $table->string('audience', 32)->default('coach')->index();
            $table->string('level', 32)->default('intro');

            $table->string('hero_image')->nullable();
            // A downloadable file (a session plan PDF) and an external video
            // are different things, and a resource may have either, both or
            // neither.
            $table->string('file_url')->nullable();
            $table->string('external_url')->nullable();
            $table->unsignedSmallInteger('read_minutes')->nullable();

            $table->boolean('is_published')->default(false)->index();
            $table->unsignedInteger('display_order')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('learning_resources');
    }
};
