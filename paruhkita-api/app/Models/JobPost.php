<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobPost extends Model
{
    protected $appends = ['remaining_quota'];

    protected $casts = [
        'application_deadline' => 'date:Y-m-d',
        'quota' => 'integer',
    ];

    protected $fillable = [
        'merchant_profile_id',
        'title',
        'category',
        'subcategory',
        'schedule',
        'location',
        'wage',
        'quota',
        'description',
        'responsibilities',
        'qualifications',
        'application_deadline',
        'status',
    ];

    public function merchantProfile()
    {
        return $this->belongsTo(MerchantProfile::class);
    }

    public function applications()
    {
        return $this->hasMany(JobApplication::class);
    }

    public function getRemainingQuotaAttribute(): int
    {
        $applications = array_key_exists('applications_count', $this->attributes)
            ? (int) $this->attributes['applications_count']
            : $this->applications()->count();

        return max(0, (int) $this->quota - $applications);
    }
}
