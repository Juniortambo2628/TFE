<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSecuritySetting extends Model
{
    protected $fillable = [
        'user_id', 'two_factor_enabled', 'two_factor_secret',
        'two_factor_recovery_codes', 'login_notifications', 'last_password_change',
    ];

    protected $casts = [
        'two_factor_enabled' => 'boolean',
        'login_notifications' => 'boolean',
        'last_password_change' => 'datetime',
    ];

    protected $hidden = [
        'two_factor_secret', 'two_factor_recovery_codes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
