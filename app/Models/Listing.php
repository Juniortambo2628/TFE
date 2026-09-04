<?php

namespace App\Models;

use App\Services\TournamentService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Str;

/**
 * Listing — anything a publisher (admin or partner) puts in front of a
 * fan on the discovery/planning surfaces. Started life as the Package
 * model in Sprint 3; Sprint 9 broadened it: the same table now backs
 * package | offer | event | tour (`type` column), and each row carries
 * a polymorphic `publisher` so both admin curation and partner-authored
 * listings live side by side.
 *
 * The historical `Package` name kept its class alias below so any
 * external references (jobs, notifications, tests) don't shatter mid-
 * migration. New code should reach for Listing.
 */
class Listing extends Model
{
    use HasFactory;

    protected $fillable = [
        'tournament_id',
        'type',
        'publisher_type',
        'publisher_id',
        'name',
        'slug',
        'description',
        'hero_image',
        'base_price',
        'currency',
        'included_match_ids',
        'included_venues',
        'nights',
        'flight_class',
        'accommodation_level',
        'capacity',
        'sold_count',
        'is_active',
        'is_featured',
        'moderation_status',
        'moderation_notes',
        'submitted_at',
        'display_order',
        'created_by',
    ];

    protected $casts = [
        'included_match_ids' => 'array',
        'included_venues' => 'array',
        'base_price' => 'decimal:2',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'nights' => 'integer',
        'capacity' => 'integer',
        'sold_count' => 'integer',
        'display_order' => 'integer',
        'submitted_at' => 'datetime',
    ];

    protected $appends = ['availability_pct', 'is_sold_out', 'seats_left'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function (Listing $listing) {
            if (empty($listing->slug)) {
                $listing->slug = Str::slug($listing->name).'-'.Str::random(6);
            }
            if (empty($listing->type)) {
                $listing->type = 'package';
            }
        });
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Polymorphic publisher — the actor that authored this listing.
     * Today it's always a User (admin or partner); the shape allows a
     * future "Organisation" or "Federation" model without a migration.
     */
    public function publisher(): MorphTo
    {
        return $this->morphTo();
    }

    public function budgets()
    {
        return $this->hasMany(Budget::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    // ── Scopes ─────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeForTournament($query, string $tournamentId)
    {
        return $query->where('tournament_id', $tournamentId);
    }

    public function scopePublishedBy($query, string $morphType, int $id)
    {
        return $query->where('publisher_type', $morphType)->where('publisher_id', $id);
    }

    public function scopeApproved($query)
    {
        return $query->where('moderation_status', 'approved');
    }

    public function scopePendingModeration($query)
    {
        return $query->where('moderation_status', 'pending');
    }

    // ── Availability accessors ─────────────────────────────────────────

    public function getSeatsLeftAttribute(): ?int
    {
        return $this->capacity === null ? null : max(0, $this->capacity - $this->sold_count);
    }

    public function getIsSoldOutAttribute(): bool
    {
        return $this->capacity !== null && $this->sold_count >= $this->capacity;
    }

    public function getAvailabilityPctAttribute(): ?int
    {
        if ($this->capacity === null || $this->capacity <= 0) {
            return null;
        }

        return (int) round(($this->sold_count / $this->capacity) * 100);
    }

    /**
     * Tournament payload resolved from config (no Tournament DB table).
     */
    public function getTournamentAttribute(): ?array
    {
        if (! $this->tournament_id) {
            return null;
        }

        return app(TournamentService::class)->get($this->tournament_id);
    }
}

// Legacy alias so any lingering `App\Models\Package` references keep
// resolving during the rename. Remove once all consumers migrate.
class_alias(Listing::class, 'App\\Models\\Package');
