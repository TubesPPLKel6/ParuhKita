<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentProfile extends Model
{
    protected $fillable = [
        'user_id',
        'photo_url',
        'phone',
        'bio',
        'university',
        'faculty',
        'major',
        'degree_level',
        'entry_year',
        'graduation_year',
        'is_currently_studying',
        'gpa',
        'linkedin_url',
        'github_url',
        'instagram_url',
        'experiences',
        'portfolio_projects',
        'is_profile_public',
    ];

    protected $casts = [
        'is_profile_public' => 'boolean',
        'is_currently_studying' => 'boolean',
        'entry_year' => 'integer',
        'graduation_year' => 'integer',
        'gpa' => 'decimal:2',
        'experiences' => 'array',
        'portfolio_projects' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
