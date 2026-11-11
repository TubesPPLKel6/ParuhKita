<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Campus extends Model
{
    protected $fillable = [
        'name',
        'code',
        'city',
        'status',
        'accreditation',
    ];

    public function studyPrograms()
    {
        return $this->hasMany(StudyProgram::class);
    }
}
