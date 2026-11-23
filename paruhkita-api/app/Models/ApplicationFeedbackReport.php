<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicationFeedbackReport extends Model
{
    protected $fillable = [
        'job_application_id',
        'cv_score',
        'portfolio_score',
        'skills_score',
        'cv_note',
        'portfolio_note',
        'skills_note',
        'recommendations',
        'status',
        'decided_at',
    ];

    protected $casts = [
        'recommendations' => 'array',
        'decided_at' => 'datetime',
        'cv_score' => 'integer',
        'portfolio_score' => 'integer',
        'skills_score' => 'integer',
    ];

    public function application()
    {
        return $this->belongsTo(JobApplication::class, 'job_application_id');
    }

    public function categories()
    {
        return $this->hasMany(ApplicationFeedbackCategory::class, 'job_application_id', 'job_application_id')
            ->orderBy('position')
            ->orderBy('id');
    }
}
