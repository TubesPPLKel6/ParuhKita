<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'role',
        'action_type',
        'description',
        'subject_type',
        'subject_id',
    ];

    // No updated_at column needed — logs are immutable
    public $timestamps = true;
    const UPDATED_AT = null;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
