<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laragear\WebAuthn\Contracts\WebAuthnAuthenticatable;
use Laragear\WebAuthn\WebAuthnAuthentication;

class User extends Authenticatable implements MustVerifyEmail, WebAuthnAuthenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, WebAuthnAuthentication;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'email',
        'password',
        'phone',
        'country',
        'country_code',
        'date_of_birth',
        'team_support',
        'seeking_financing',
        'employment_status',
        'loan_return_period',
        'banking_partners_consent',
        'marketing_consent',
        'terms_agreed',
        'registration_completed',
        'status',
        'is_partner',
        'privacy_consent',
        'privacy_consent_at',
        'cover_image',
        'community_consent',
        'google_id',
        'avatar',
        'is_admin',
        'company_name',
        'company_address',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'date_of_birth' => 'date',
        'marketing_consent' => 'boolean',
        'is_partner' => 'boolean',
        'is_admin' => 'boolean',
        'privacy_consent' => 'boolean',
        'privacy_consent_at' => 'datetime',
        'community_consent' => 'boolean',
    ];

    public function profile()
    {
        return $this->hasOne(Profile::class);
    }

    public function securitySetting()
    {
        return $this->hasOne(UserSecuritySetting::class);
    }

    public function receivedMessages()
    {
        return $this->hasMany(Message::class, 'user_id');
    }

    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function predictions()
    {
        return $this->hasMany(Prediction::class);
    }

    public function followers()
    {
        return $this->hasMany(Follow::class, 'following_id');
    }

    public function savingsGoals()
    {
        return $this->hasMany(SavingsGoal::class);
    }

    public function loanApplications()
    {
        return $this->hasMany(LoanApplication::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function eventRsvps()
    {
        return $this->hasMany(EventRsvp::class);
    }

    public function tribes()
    {
        return $this->belongsToMany(Tribe::class, 'tribe_members')
            ->withPivot('role', 'joined_at');
    }

    /**
     * Determine if the user has verified their email address.
     *
     * @return bool
     */
    public function hasVerifiedEmail()
    {
        if (app()->environment('local')) {
            return true;
        }

        return ! is_null($this->email_verified_at);
    }
}
