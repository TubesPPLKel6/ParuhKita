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
        'nim',
        'ktm_file_path',
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
        'is_verified',
        'verification_status',
        'verification_submitted_at',
        'verified_at',
        'verification_note',
        'verified_by_user_id',
    ];

    protected $casts = [
        'is_profile_public' => 'boolean',
        'is_verified' => 'boolean',
        'is_currently_studying' => 'boolean',
        'entry_year' => 'integer',
        'graduation_year' => 'integer',
        'gpa' => 'decimal:2',
        'experiences' => 'array',
        'portfolio_projects' => 'array',
        'verification_submitted_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
