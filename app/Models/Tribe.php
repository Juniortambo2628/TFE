<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Tribe extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'avatar',
        'banner',
        'created_by',
        'privacy',
        'forum_enabled',
        'tournament_id',
    ];

    protected $casts = [
        'member_count' => 'integer',
        'posts_count' => 'integer',
        'forum_enabled' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($tribe) {
            if (empty($tribe->slug)) {
                $tribe->slug = Str::slug($tribe->name);
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members(): HasMany
    {
        return $this->hasMany(TribeMember::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'tribe_members')
            ->withPivot('role', 'joined_at');
    }

    /**
     * Check if a user is a member of this tribe
     */
    public function hasMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists();
    }

    /**
     * Add a user to the tribe
     */
    public function addMember(User $user, string $role = 'member'): TribeMember
    {
        $member = $this->members()->create([
            'user_id' => $user->id,
            'role' => $role,
            'joined_at' => now(),
        ]);
        $this->increment('member_count');

        return $member;
    }

    /**
     * Remove a user from the tribe
     */
    public function removeMember(User $user): bool
    {
        $deleted = $this->members()->where('user_id', $user->id)->delete();
        if ($deleted) {
            $this->decrement('member_count');
        }

        return $deleted > 0;
    }

    /**
     * Check if a user is an admin of this tribe
     */
    public function isAdmin(User $user): bool
    {
        return $this->members()
            ->where('user_id', $user->id)
            ->where('role', 'admin')
            ->exists();
    }

    /**
     * Check if a user is the owner/creator of this tribe
     */
    public function isOwner(User $user): bool
    {
        return $this->created_by === $user->id;
    }

    // ── Tournament scoping ─────────────────────────────────────────────
    //
    // A NULL tournament_id means "open to fans of every tournament" —
    // useful for meta-communities (e.g. an African-football fan tribe
    // that spans AFCON + WC + Euros). A set tournament_id scopes the
    // tribe to fans of that one tournament.

    public function scopeForTournament($query, ?string $tournamentId)
    {
        if ($tournamentId === null) {
            return $query;
        }

        return $query->where(function ($q) use ($tournamentId) {
            $q->where('tournament_id', $tournamentId)
                ->orWhereNull('tournament_id');
        });
    }

    public function scopeOnlyCrossTournament($query)
    {
        return $query->whereNull('tournament_id');
    }

    public function scopeOnlyForTournament($query, string $tournamentId)
    {
        return $query->where('tournament_id', $tournamentId);
    }

    /**
     * Resolve the tournament payload for this tribe from config, or null
     * for cross-tournament tribes.
     */
    public function getTournamentAttribute(): ?array
    {
        if (! $this->tournament_id) {
            return null;
        }

        return app(\App\Services\TournamentService::class)->get($this->tournament_id);
    }
}
