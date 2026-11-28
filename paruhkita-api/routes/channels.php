<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversations.{conversationId}', function (User $user, int $conversationId) {
    $conversation = Conversation::with('application.jobPost.merchantProfile')->find($conversationId);

    if (!$conversation) {
        return false;
    }

    $application = $conversation->application;

    return ($user->role === 'mahasiswa' && $application->user_id === $user->id)
        || ($user->role === 'merchant' && $application->jobPost->merchantProfile->user_id === $user->id);
});

// Activity Log channels
// Private channel for all admins (must be registered BEFORE activity-logs.{userId})
Broadcast::channel('activity-logs.admin', function (User $user) {
    return $user->role === 'admin';
});

// Private channel per user (Pelamar & Merchant)
Broadcast::channel('activity-logs.{userId}', function (User $user, $userId) {
    return ctype_digit((string) $userId)
        && (int) $user->id === (int) $userId
        && in_array($user->role, ['mahasiswa', 'merchant']);
});
