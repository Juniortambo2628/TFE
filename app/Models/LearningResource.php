<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * A single piece of learning material — a coaching guide, a safeguarding
 * policy, a session plan, a video.
 *
 * Distinct from a `Listing` of type `program` on purpose: a programme is
 * something you enrol in (capacity, price, dates); a resource is something
 * you read or watch. See the migration for why they are not one table.
 */
class LearningResource extends Model
{
    use HasFactory;

    /**
     * The filter taxonomy, and the ONE place it is defined.
     *
     * The controller validates against these, the index page renders its
     * chips from them, and the seeder picks from them — so a new category
     * cannot appear in one place and be rejected by another.
     */
    public const CATEGORIES = [
        'coaching' => 'Coaching',
        'safeguarding' => 'Safeguarding',
        'officiating' => 'Officiating',
        'wellbeing' => 'Health & wellbeing',
        'administration' => 'Running a club',
    ];

    public const AUDIENCES = [
        'coach' => 'Coaches',
        'teacher' => 'Teachers',
        'parent' => 'Parents & guardians',
        'player' => 'Players',
        'administrator' => 'Administrators',
    ];

    public const LEVELS = [
        'intro' => 'Introductory',
        'intermediate' => 'Intermediate',
        'advanced' => 'Advanced',
    ];

    protected $fillable = [
        'publisher_type',
        'publisher_id',
        'listing_id',
        'title',
        'slug',
        'summary',
        'body',
        'category',
        'audience',
        'level',
        'hero_image',
        'file_url',
        'external_url',
        'read_minutes',
        'is_published',
        'display_order',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'read_minutes' => 'integer',
        'display_order' => 'integer',
    ];

    protected static function booted(): void
    {
        // A slug is what the public URL is built from, so it must exist —
        // but never clobber one that was set deliberately.
        static::saving(function (self $resource) {
            if (blank($resource->slug)) {
                $resource->slug = Str::slug($resource->title);
            }
        });
    }

    public function publisher()
    {
        return $this->morphTo();
    }

    /** The programme this is a module of, when it is one. */
    public function listing()
    {
        return $this->belongsTo(Listing::class);
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeInCategory($query, ?string $category)
    {
        return $category ? $query->where('category', $category) : $query;
    }

    public function scopeForAudience($query, ?string $audience)
    {
        return $audience ? $query->where('audience', $audience) : $query;
    }

    /**
     * The compact publisher block `PoweredByBadge` renders, matching
     * `Listing::publisherSummary()` exactly so one component serves both.
     * Null for admin-authored rows, which have no partner behind them.
     */
    public function publisherSummary(): ?array
    {
        $publisher = $this->publisher;
        $profile = $publisher?->partnerProfile;

        if (! $profile) {
            return null;
        }

        return [
            'slug' => $profile->slug,
            'display_name' => $profile->display_name,
            'logo_url' => $profile->logo_url,
            'theme_accent' => $profile->theme_accent,
            'verified' => $publisher->verification_status === 'verified',
        ];
    }

    public function categoryLabel(): string
    {
        return self::CATEGORIES[$this->category] ?? $this->category;
    }

    public function audienceLabel(): string
    {
        return self::AUDIENCES[$this->audience] ?? $this->audience;
    }
}
