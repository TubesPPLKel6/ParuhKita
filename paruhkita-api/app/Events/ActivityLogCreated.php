<?php

namespace App\Events;

use App\Models\ActivityLog;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ActivityLogCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ActivityLog $log)
    {
    }

    public function broadcastOn(): array
    {
        // Admin logs go to a shared admin channel; others get a personal channel
        if ($this->log->role === 'admin') {
            return [new PrivateChannel('activity-logs.admin')];
        }

        return [new PrivateChannel('activity-logs.' . $this->log->user_id)];
    }

    public function broadcastAs(): string
    {
        return 'activity-log.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id'          => $this->log->id,
            'user_id'     => $this->log->user_id,
            'role'        => $this->log->role,
            'action_type' => $this->log->action_type,
            'description' => $this->log->description,
            'subject_type'=> $this->log->subject_type,
            'subject_id'  => $this->log->subject_id,
            'created_at'  => $this->log->created_at,
        ];
    }
}
