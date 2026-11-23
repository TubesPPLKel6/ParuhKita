<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobApplication extends Model
{
    protected $fillable = [
        'job_post_id',
        'user_id',
        'status',
        'merchant_note',
        'motivation',
    ];

    public function jobPost()
    {
        return $this->belongsTo(JobPost::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function documents()
    {
        return $this->hasMany(JobApplicationDocument::class);
    }

    public function statusHistories()
    {
        return $this->hasMany(JobApplicationStatusHistory::class)->orderBy('created_at');
    }

    public function interviewSchedules()
    {
        return $this->hasMany(InterviewSchedule::class);
    }

    public function interviewEvaluation()
    {
        return $this->hasOne(InterviewEvaluation::class);
    }

    public function feedbackReport()
    {
        return $this->hasOne(ApplicationFeedbackReport::class);
    }
}
