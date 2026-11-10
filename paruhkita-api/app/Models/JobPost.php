<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobPost extends Model
{
    protected $casts = [
        'application_deadline' => 'date:Y-m-d',
    ];

    protected $fillable = [
        'merchant_profile_id',
        'title',
        'category',
        'subcategory',
        'schedule',
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
}
