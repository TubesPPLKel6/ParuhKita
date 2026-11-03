<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'email_verified_at',
        'role',
        'phone',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Relasi
    public function studentProfile()
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function merchantProfile()
    {
        return $this->hasOne(MerchantProfile::class);
    }

    public function studentSkills()
    {
        return $this->hasMany(StudentSkill::class);
    }

    public function studentAvailabilities()
    {
        return $this->hasMany(StudentAvailability::class);
    }

    public function studentCvs()
    {
        return $this->hasMany(StudentCv::class);
    }

    public function studentPortfolios()
    {
        return $this->hasMany(StudentPortfolio::class);
    }
}
