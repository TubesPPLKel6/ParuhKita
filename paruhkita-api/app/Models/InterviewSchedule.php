<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InterviewSchedule extends Model
{
    protected $fillable = [
        'merchant_profile_id',
        'job_post_id',
        'job_application_id',
        'user_id',
        'interview_type',
        'scheduled_date',
        'start_time',
        'end_time',
        'location',
        'status',
        'availability_label',
        'note',
    ];

    protected $casts = [
        'scheduled_date' => 'date:Y-m-d',
    ];

    public function merchantProfile()
    {
        return $this->belongsTo(MerchantProfile::class);
    }

    public function jobPost()
    {
        return $this->belongsTo(JobPost::class);
    }

    public function application()
    {
        return $this->belongsTo(JobApplication::class, 'job_application_id');
    }

    public function candidate()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function evaluation()
    {
        return $this->hasOne(InterviewEvaluation::class);
    }
}
