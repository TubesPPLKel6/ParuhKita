<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MerchantVerificationDocument extends Model
{
    protected $fillable = [
        'merchant_profile_id',
        'document_type',
        'file_path',
        'original_name',
    ];

    public function merchantProfile()
    {
        return $this->belongsTo(MerchantProfile::class);
    }
}
