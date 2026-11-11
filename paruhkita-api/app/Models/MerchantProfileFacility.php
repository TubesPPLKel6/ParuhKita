<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MerchantProfileFacility extends Model
{
    protected $fillable = [
        'name',
        'category',
        'description',
    ];

    public function merchantProfile()
    {
        return $this->belongsTo(MerchantProfile::class);
    }
}
