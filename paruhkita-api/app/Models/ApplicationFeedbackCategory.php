<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicationFeedbackCategory extends Model
{
    protected $fillable = [
        'job_application_id',
        'name',
        'score',
        'note',
        'position',
        'is_default',
    ];

    protected $casts = [
        'score' => 'integer',
        'position' => 'integer',
        'is_default' => 'boolean',
    ];

    public function report()
    {
        return $this->belongsTo(ApplicationFeedbackReport::class, 'job_application_id', 'job_application_id');
    }
}
