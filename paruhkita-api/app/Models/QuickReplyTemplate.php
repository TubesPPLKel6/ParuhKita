<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuickReplyTemplate extends Model
{
    public const CATEGORIES = [
        'Undangan Wawancara',
        'Konfirmasi Administrasi',
        'Penawaran Kerja',
        'Umum',
    ];

    protected $fillable = [
        'merchant_profile_id',
        'title',
        'category',
        'body',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function merchantProfile()
    {
        return $this->belongsTo(MerchantProfile::class);
    }
}
