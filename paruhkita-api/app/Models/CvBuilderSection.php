<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CvBuilderSection extends Model
{
    protected $fillable = [
        'cv_id',
        'section_type',
        'title',
        'content',
        'order',
    ];

    protected $casts = [
        'content' => 'array',
    ];

    public function cv()
    {
        return $this->belongsTo(StudentCv::class, 'cv_id');
    }
}
