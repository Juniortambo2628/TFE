<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * What a school warrants when it submits a group request.
 *
 * Deliberately holds no pupil data — see the migration. The school keeps
 * parental consent, safeguarding and duty of care on its own systems; this
 * records that those channels were followed, who said so, and how many
 * people are travelling.
 */
class SchoolGroupDeclaration extends Model
{
    use HasFactory;

    protected $fillable = [
        'budget_id',
        'school_name',
        'official_name',
        'official_role',
        'official_email',
        'official_phone',
        'travellers_adults',
        'travellers_minors',
        'youngest_traveller_age',
        'channels_confirmed',
        'information_accurate',
        'declared_at',
        'notes',
    ];

    protected $casts = [
        'travellers_adults' => 'integer',
        'travellers_minors' => 'integer',
        'youngest_traveller_age' => 'integer',
        'channels_confirmed' => 'boolean',
        'information_accurate' => 'boolean',
        'declared_at' => 'datetime',
    ];

    public function budget()
    {
        return $this->belongsTo(Budget::class);
    }

    /**
     * The flag every downstream surface keys off.
     *
     * If TFE knows minors are travelling and does not tell the partner,
     * that is TFE's failure and not the school's — so this is a derived
     * fact from the counts, never a separate boolean somebody can forget
     * to set or leave disagreeing with the numbers beside it.
     */
    public function involvesMinors(): bool
    {
        return $this->travellers_minors > 0;
    }

    public function totalTravellers(): int
    {
        return $this->travellers_adults + $this->travellers_minors;
    }

    /**
     * The one line a partner reads: "34 under 18, 6 staff · youngest 12".
     *
     * Age is appended only when it is known; a missing age is left out
     * rather than rendered as a guess or a zero.
     */
    public function partySummary(): string
    {
        $parts = [];

        if ($this->travellers_minors > 0) {
            $parts[] = $this->travellers_minors.' under 18';
        }

        if ($this->travellers_adults > 0) {
            $parts[] = $this->travellers_adults.' staff';
        }

        if (empty($parts)) {
            return 'No travellers declared';
        }

        $summary = implode(', ', $parts);

        if ($this->involvesMinors() && $this->youngest_traveller_age !== null) {
            $summary .= ' · youngest '.$this->youngest_traveller_age;
        }

        return $summary;
    }

    /**
     * Complete only when BOTH warranties are given. A declaration with one
     * box ticked is not a partial declaration — it is not one at all, and
     * must not read as though a school has stood behind the trip.
     */
    public function isComplete(): bool
    {
        return $this->channels_confirmed
            && $this->information_accurate
            && $this->declared_at !== null;
    }

    /** The block every partner-facing payload carries. */
    public function toPartnerPayload(): array
    {
        return [
            'school_name' => $this->school_name,
            'official_name' => $this->official_name,
            'official_role' => $this->official_role,
            'official_email' => $this->official_email,
            'official_phone' => $this->official_phone,
            'travellers_adults' => $this->travellers_adults,
            'travellers_minors' => $this->travellers_minors,
            'youngest_traveller_age' => $this->youngest_traveller_age,
            'total_travellers' => $this->totalTravellers(),
            'party_summary' => $this->partySummary(),
            'involves_minors' => $this->involvesMinors(),
            'is_complete' => $this->isComplete(),
            'declared_at' => $this->declared_at?->format('Y-m-d H:i'),
            'notes' => $this->notes,
        ];
    }
}
