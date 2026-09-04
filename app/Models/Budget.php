<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Budget extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tournament_id',
        'name',
        'total_cost',
        'match_ids',
        'accommodation_level',
        'flight_class',
        'breakdown',
        'nights',
        'is_active',
        'partner_status',
        'partner_cost',
        'partner_breakdown',
        'partner_notes',
        'partner_document',
    ];

    protected $casts = [
        'match_ids' => 'array',
        'breakdown' => 'array',
        'is_active' => 'boolean',
        'partner_breakdown' => 'array',
    ];

    protected $appends = ['match_count', 'reference_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Resolve the full tournament payload for this budget from config
     * (there is no Tournament model — tournaments live in config/tournaments.php
     * and are enriched at runtime by TournamentService).
     */
    public function getTournamentAttribute(): ?array
    {
        if (! $this->tournament_id) {
            return null;
        }

        return app(\App\Services\TournamentService::class)->get($this->tournament_id);
    }

    public function getMatchCountAttribute()
    {
        return is_array($this->match_ids) ? count($this->match_ids) : 0;
    }

    public function getReferenceIdAttribute(): string
    {
        return 'REQ-'.str_pad($this->id, 6, '0', STR_PAD_LEFT);
    }
}
