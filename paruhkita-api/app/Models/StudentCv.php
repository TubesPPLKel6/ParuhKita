<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentCv extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'type',
        'file_url',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function sections()
    {
        return $this->hasMany(CvBuilderSection::class, 'cv_id');
    }
}
