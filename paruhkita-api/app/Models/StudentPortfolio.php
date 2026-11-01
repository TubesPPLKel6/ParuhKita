<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentPortfolio extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'file_url',
        'file_type',
        'file_size',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
