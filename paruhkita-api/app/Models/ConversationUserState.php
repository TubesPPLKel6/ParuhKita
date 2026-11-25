<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConversationUserState extends Model
{
    protected $fillable = ['conversation_id', 'user_id', 'archived_at', 'deleted_at', 'deleted_before_message_id', 'unread_at'];

    protected function casts(): array
    {
        return [
            'archived_at' => 'datetime',
            'deleted_at' => 'datetime',
            'unread_at' => 'datetime',
        ];
    }
}
