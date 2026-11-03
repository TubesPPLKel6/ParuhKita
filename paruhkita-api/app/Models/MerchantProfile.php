<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MerchantProfile extends Model
{
    protected $fillable = [
        'user_id',
        'merchant_name',
        'category',
        'description',
        'phone',
        'address',
        'logo_path',
        'banner_path',
        'is_verified',
        'verification_status',
        'verification_submitted_at',
        'verification_note',
    ];

    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
            'verification_submitted_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function verificationDocuments()
    {
        return $this->hasMany(MerchantVerificationDocument::class);
    }

    public function facilities()
    {
        return $this->hasMany(MerchantProfileFacility::class);
    }

    public function jobPosts()
    {
        return $this->hasMany(JobPost::class);
    }
}
