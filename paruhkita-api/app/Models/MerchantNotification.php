<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MerchantNotification extends Model
{
    protected $fillable = [
        'merchant_profile_id',
        'recruitment_report_id',
        'title',
        'message',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function merchantProfile()
    {
        return $this->belongsTo(MerchantProfile::class);
    }

    public function recruitmentReport()
    {
        return $this->belongsTo(RecruitmentReport::class);
    }
}
