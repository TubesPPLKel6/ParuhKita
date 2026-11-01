<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentSkill extends Model
{
    protected $fillable = [
        'user_id',
        'skill_name',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
