<?php

namespace App\Services;

use App\Events\ActivityLogCreated;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    /**
     * Record an activity log entry and broadcast it via WebSocket.
     *
     * @param int    $userId
     * @param string $role         mahasiswa | merchant | admin
     * @param string $actionType   create | update | delete
     * @param string $description  Human-readable Indonesian description
     * @param string|null $subjectType  Model class name or short label
     * @param int|null    $subjectId
     */
    public static function log(
        int $userId,
        string $role,
        string $actionType,
        string $description,
        ?string $subjectType = null,
        ?int $subjectId = null
    ): ActivityLog {
        $log = ActivityLog::create([
            'user_id'      => $userId,
            'role'         => $role,
            'action_type'  => $actionType,
            'description'  => $description,
            'subject_type' => $subjectType,
            'subject_id'   => $subjectId,
        ]);

        // Broadcast real-time event (fail-safe so CRUD actions succeed even if Reverb is offline)
        try {
            broadcast(new ActivityLogCreated($log))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        return $log;
    }

    /**
     * Convenience: log for the currently authenticated user.
     */
    public static function logAuth(
        string $actionType,
        string $description,
        ?string $subjectType = null,
        ?int $subjectId = null
    ): ?ActivityLog {
        $user = Auth::user();
        if (!$user) {
            return null;
        }

        return self::log(
            $user->id,
            $user->role,
            $actionType,
            $description,
            $subjectType,
            $subjectId
        );
    }
}
