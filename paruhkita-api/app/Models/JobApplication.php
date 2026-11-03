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
    ];

    public function jobPost()
    {
        return $this->belongsTo(JobPost::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
