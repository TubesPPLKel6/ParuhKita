<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentAvailability extends Model
{
    protected $fillable = [
        'user_id',
        'day_of_week',
        'start_time',
        'end_time',
        'hours_per_day',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
