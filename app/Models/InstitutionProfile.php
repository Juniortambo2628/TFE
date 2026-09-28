<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * The organisation behind an institution account (Sprint 62).
 *
 * The account holder is the institution; the person who signed it up is its
 * appointed official, whose name and email stay on `users` so there is one
 * record of who to contact rather than two that can disagree.
 */
class InstitutionProfile extends Model
{
    use HasFactory;

    /**
     * The ONE taxonomy — the controller validates against it, the sign-up
     * form renders its options from it, and the dashboard labels read it.
     * Adding a type here is the whole change.
     */
    public const TYPES = [
        'school' => 'School',
        'university' => 'University or college',
        'academy' => 'Sports academy',
        'club' => 'Community sports club',
        'community_group' => 'Community group',
        'faith_group' => 'Faith or youth group',
    ];

    protected $fillable = [
        'user_id',
        'institution_name',
        'institution_type',
        'registration_number',
        'country',
        'city',
        'address',
        'official_role',
        'contact_phone',
        'verification_status',
        'verified_at',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function typeLabel(): string
    {
        return self::TYPES[$this->institution_type] ?? 'Institution';
    }

    public function isVerified(): bool
    {
        return $this->verification_status === 'verified';
    }

    /**
     * Where the institution is, in one line. Returns null rather than a
     * stray comma when only the country is known.
     */
    public function location(): ?string
    {
        $parts = array_filter([$this->city, $this->country]);

        return $parts === [] ? null : implode(', ', $parts);
    }
}
