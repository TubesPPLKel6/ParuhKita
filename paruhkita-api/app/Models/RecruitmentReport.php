<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecruitmentReport extends Model
{
    protected $fillable = [
        'reporter_id',
        'job_post_id',
        'merchant_profile_id',
        'stage',
        'category',
        'title',
        'description',
        'evidence_path',
        'evidence_name',
        'status',
        'admin_note',
    ];

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function jobPost()
    {
        return $this->belongsTo(JobPost::class);
    }

    public function merchantProfile()
    {
        return $this->belongsTo(MerchantProfile::class);
    }
}
