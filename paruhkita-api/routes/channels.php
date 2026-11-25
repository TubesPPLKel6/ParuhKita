<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

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
