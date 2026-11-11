<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobCategory extends Model
{
    protected $attributes = [
        'status' => 'active',
    ];

    protected $fillable = [
        'name',
        'description',
        'status',
    ];

    public function subcategories()
    {
        return $this->hasMany(JobSubcategory::class);
    }
}
