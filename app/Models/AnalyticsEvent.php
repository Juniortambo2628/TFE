<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnalyticsEvent extends Model
{
    use HasFactory;

    protected $fillable = ['event_name', 'metadata', 'user_id'];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function log($name, $data = null)
    {
        return self::create([
            'event_name' => $name,
            'metadata' => $data,
            'user_id' => auth()->id(),
        ]);
    }
}
