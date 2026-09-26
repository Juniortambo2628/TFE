<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaAsset extends Model
{
    protected $fillable = [
        'disk',
        'path',
        'url',
        'name',
        'mime',
        'kind',
        'size',
        'width',
        'height',
        'uploaded_by',
    ];

    protected $casts = [
        'size' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
    ];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
