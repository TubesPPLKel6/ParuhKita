<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudyProgram extends Model
{
    protected $fillable = [
        'campus_id',
        'name',
        'code',
        'degree_level',
        'status',
    ];

    public function campus()
    {
        return $this->belongsTo(Campus::class);
    }
}
