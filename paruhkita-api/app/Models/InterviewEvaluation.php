<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InterviewEvaluation extends Model
{
    protected $fillable = [
        'interview_schedule_id',
        'job_application_id',
        'criteria',
        'total_score',
        'recommendation',
        'feedback',
        'send_feedback',
        'decision',
        'status',
    ];

    protected $casts = [
        'criteria' => 'array',
        'send_feedback' => 'boolean',
        'total_score' => 'integer',
    ];

    public function schedule()
    {
        return $this->belongsTo(InterviewSchedule::class, 'interview_schedule_id');
    }

    public function application()
    {
        return $this->belongsTo(JobApplication::class, 'job_application_id');
    }
}
