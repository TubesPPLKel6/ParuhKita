<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobApplicationStatusHistory extends Model
{
    protected $fillable = [
        'job_application_id',
        'status',
        'note',
    ];

    public function jobApplication()
    {
        return $this->belongsTo(JobApplication::class);
    }
}
