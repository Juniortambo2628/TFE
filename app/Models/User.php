<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laragear\WebAuthn\Contracts\WebAuthnAuthenticatable;
use Laragear\WebAuthn\WebAuthnAuthentication;

class User extends Authenticatable implements MustVerifyEmail, WebAuthnAuthenticatable
{
    /** @use HasFactory<UserFactory> */
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
        'team_support',
        'bio',
        'marketing_consent',
        'terms_agreed',
        'registration_completed',
        'status',
        'is_partner',
        'account_type',
        'partner_type',
        'verification_status',
        'services_offered',
        'privacy_consent',
        'privacy_consent_at',
        'cover_image',
        'community_consent',
        'google_id',
        'avatar',
        'is_admin',
        'company_name',
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
        'marketing_consent' => 'boolean',
        'is_partner' => 'boolean',
        'is_admin' => 'boolean',
        'services_offered' => 'array',
        'privacy_consent' => 'boolean',
        'privacy_consent_at' => 'datetime',
        'community_consent' => 'boolean',
    ];

    public function profile()
    {
        return $this->hasOne(Profile::class);
    }

    /**
     * The organisation behind an institution account — only institutions
     * have one (Sprint 62).
     */
    public function institutionProfile()
    {
        return $this->hasOne(InstitutionProfile::class);
    }

    /**
     * Whether this account represents an organisation rather than a person.
     *
     * Read the COLUMN, never the presence of the profile row: a profile that
     * failed to save would silently demote a school back to a fan, and the
     * group surfaces would 403 with nothing to explain why.
     */
    public function isInstitution(): bool
    {
        return $this->account_type === 'institution';
    }

    /**
     * The ONE institution payload — the group dashboard, the trip planner's
     * declaration prefill, and anything added later all read this shape.
     *
     * It spans both tables on purpose: the organisation's details live on
     * the profile, its official's name and email live on `users`, and a
     * second copy of either is how the two come to disagree.
     *
     * Null for an individual account, and for an institution whose profile
     * somehow did not save — callers must treat absence as "no defaults",
     * never as an error.
     */
    public function institutionPayload(): ?array
    {
        $profile = $this->institutionProfile;

        if (! $this->isInstitution() || ! $profile) {
            return null;
        }

        return [
            'institution_name' => $profile->institution_name,
            'institution_type' => $profile->institution_type,
            'type_label' => $profile->typeLabel(),
            'location' => $profile->location(),
            'verification_status' => $profile->verification_status,
            'is_verified' => $profile->isVerified(),
            'official_name' => trim($this->first_name.' '.$this->last_name),
            'official_role' => $profile->official_role,
            'official_email' => $this->email,
            'official_phone' => $profile->contact_phone,
        ];
    }

    /**
     * Partner-hub branded profile — only partner users have one.
     * Nullable relation; controllers that need it should firstOrCreate.
     */
    public function partnerProfile()
    {
        return $this->hasOne(PartnerProfile::class);
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

    /**
     * The fan's tribe membership rows — lets a listing resolve "am I in this
     * tribe?" for every tribe in one query instead of one per card.
     */
    public function tribeMemberships()
    {
        return $this->hasMany(TribeMember::class);
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
