<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Package extends Model
{
    use HasFactory;

    protected $fillable = [
        'tournament_id',
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
    ];

    protected $appends = ['availability_pct', 'is_sold_out', 'seats_left'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function (Package $package) {
            if (empty($package->slug)) {
                $package->slug = Str::slug($package->name).'-'.Str::random(6);
            }
        });
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function budgets()
    {
        return $this->hasMany(Budget::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Tournament payload resolved from config (no Tournament DB table).
     */
    public function getTournamentAttribute(): ?array
    {
        if (! $this->tournament_id) {
            return null;
        }

        return app(\App\Services\TournamentService::class)->get($this->tournament_id);
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

    public function scopeForTournament($query, string $tournamentId)
    {
        return $query->where('tournament_id', $tournamentId);
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
}
