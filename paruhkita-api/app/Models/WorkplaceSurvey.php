<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkplaceSurvey extends Model
{
    protected $fillable = [
        'user_id',
        'merchant_profile_id',
        'position',
        'department',
        'start_date',
        'end_date',
        'ratings',
        'comments',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'ratings' => 'array',
        ];
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function merchantProfile()
    {
        return $this->belongsTo(MerchantProfile::class);
    }
}