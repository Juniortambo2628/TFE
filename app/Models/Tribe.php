<?php

namespace App\Models;

use App\Services\TournamentService;
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

    public function posts(): HasMany
    {
        return $this->hasMany(TribePost::class);
    }

    public function joinRequests(): HasMany
    {
        return $this->hasMany(TribeJoinRequest::class);
    }

    // ── Privacy ────────────────────────────────────────────────────────
    //
    // public       — anyone may join immediately, anyone may read.
    // private      — readable only by members; joining needs an admin's
    //                approval (that is what the form has always promised).
    // invite_only  — readable only by members; a fan cannot ask at all, an
    //                admin has to add them.

    public function isPublic(): bool
    {
        return $this->privacy === 'public';
    }

    public function requiresApproval(): bool
    {
        return $this->privacy === 'private';
    }

    public function isInviteOnly(): bool
    {
        return $this->privacy === 'invite_only';
    }

    /**
     * Can this user read the tribe's discussions and member list?
     */
    public function canBeViewedBy(User $user): bool
    {
        return $this->isPublic() || $this->hasMember($user) || $user->is_admin;
    }

    /**
     * Can this user manage the tribe (edit it, moderate posts, decide on
     * join requests)? Platform admins can, so moderation is never stuck
     * behind an abandoned tribe.
     */
    public function canBeManagedBy(User $user): bool
    {
        return $this->isAdmin($user) || $user->is_admin;
    }

    /**
     * A tribe's other admins, excluding the given user.
     */
    public function otherAdmins(User $user)
    {
        return $this->members()
            ->where('role', 'admin')
            ->where('user_id', '!=', $user->id);
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
        // firstOrCreate, not create: a double-submitted join used to insert a
        // second membership row and inflate member_count for good.
        $member = $this->members()->firstOrCreate(
            ['user_id' => $user->id],
            ['role' => $role, 'joined_at' => now()],
        );

        $this->syncCounts();

        return $member;
    }

    /**
     * Remove a user from the tribe
     */
    public function removeMember(User $user): bool
    {
        $deleted = $this->members()->where('user_id', $user->id)->delete();

        if ($deleted) {
            $this->syncCounts();
        }

        return $deleted > 0;
    }

    /**
     * Recompute the denormalised counters from the rows themselves.
     *
     * member_count and posts_count are columns the listing reads directly.
     * They were maintained with increment()/decrement() in one place and not at
     * all in others — creating a discussion never touched posts_count, so every
     * tribe card reported "0 posts" forever. Deriving them removes the drift.
     */
    public function syncCounts(): void
    {
        $this->forceFill([
            'member_count' => $this->members()->count(),
            'posts_count' => $this->posts()->count(),
        ])->saveQuietly();
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

        return app(TournamentService::class)->get($this->tournament_id);
    }
}
