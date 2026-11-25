<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\ConversationUserState;
use App\Models\JobApplication;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $this->ensureAllowedRole($user->role);

        $applicationsWithoutConversation = JobApplication::query()
            ->select('id')
            ->where(function ($query) use ($user) {
                if ($user->role === 'mahasiswa') {
                    $query->where('user_id', $user->id);
                } else {
                    $query->whereHas('jobPost.merchantProfile', fn ($merchant) => $merchant->where('user_id', $user->id));
                }
            })
            ->whereDoesntHave('conversation')
            ->get();

        foreach ($applicationsWithoutConversation as $application) {
            $application->conversation()->create();
        }

        $filter = $request->validate([
            'filter' => 'nullable|in:all,unread,archived',
            'q' => 'nullable|string|max:100',
        ]);
        $query = trim($filter['q'] ?? '');

        $conversations = Conversation::with([
            'application.jobPost.merchantProfile.user',
            'application.student',
            'latestMessage.sender:id,name',
            'userStates' => fn ($states) => $states->where('user_id', $user->id),
        ])
            ->whereHas('application', function ($application) use ($user) {
                if ($user->role === 'mahasiswa') {
                    $application->where('user_id', $user->id);
                } else {
                    $application->whereHas('jobPost.merchantProfile', fn ($merchant) => $merchant->where('user_id', $user->id));
                }
            })
            ->withCount([
                'messages as unread_count' => fn ($messages) => $messages
                    ->where('sender_id', '!=', $user->id)
                    ->whereNull('read_at')
                    ->whereRaw(
                        'messages.id > COALESCE((SELECT deleted_before_message_id FROM conversation_user_states WHERE conversation_user_states.conversation_id = messages.conversation_id AND conversation_user_states.user_id = ?), 0)',
                        [$user->id],
                    ),
            ])
            ->latest('updated_at')
            ->get()
            ->map(fn (Conversation $conversation) => $this->conversationSummary($conversation, $user->id))
            ->filter(function (array $item) use ($filter, $query) {
                if ($item['deleted'] || ($filter['filter'] ?? 'all') !== 'archived' && $item['is_archived']) {
                    return false;
                }
                if (($filter['filter'] ?? 'all') === 'archived' && !$item['is_archived']) {
                    return false;
                }
                if (($filter['filter'] ?? null) === 'unread' && !$item['is_unread']) {
                    return false;
                }
                if ($query !== '' && !str_contains(mb_strtolower($item['search_text']), mb_strtolower($query))) {
                    return false;
                }

                return true;
            })
            ->values()
            ->map(function (array $item) {
                unset($item['search_text'], $item['deleted']);
                return $item;
            });

        return response()->json(['status' => true, 'data' => $conversations]);
    }

    public function show(Request $request, Conversation $conversation)
    {
        $conversation = $this->authorizedConversation($request, $conversation);
        $state = $this->stateFor($conversation, $request->user()->id);
        $messages = $conversation->messages()
            ->where(fn ($query) => $state->deleted_at
                ? $query->where('id', '>', $state->deleted_before_message_id ?? 0)
                : $query)
            ->with('sender:id,name')
            ->oldest()
            ->get();

        $conversation->messages()
            ->where('sender_id', '!=', $request->user()->id)
            ->whereNull('read_at')
            ->when($state->deleted_at, fn ($query) => $query->where('id', '>', $state->deleted_before_message_id ?? 0))
            ->update(['read_at' => now()]);
        $state->update(['unread_at' => null]);
        $conversation->setRelation('latestMessage', $messages->last());
        $conversation->setAttribute('unread_count', 0);

        return response()->json([
            'status' => true,
            'data' => [
                'conversation' => $this->conversationSummary($conversation->load('application.jobPost.merchantProfile', 'application.student', 'userStates'), $request->user()->id),
                'messages' => $messages->map(fn (Message $message) => $this->messageData($message, $request->user()->id)),
            ],
        ]);
    }

    public function send(Request $request, Conversation $conversation)
    {
        $conversation = $this->authorizedConversation($request, $conversation);
        $state = $this->stateFor($conversation, $request->user()->id);
        $validated = $request->validate([
            'body' => 'nullable|string|max:5000',
            'attachment' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);
        $body = trim($validated['body'] ?? '');
        if ($body === '' && !$request->hasFile('attachment')) {
            throw ValidationException::withMessages(['body' => 'Pesan atau lampiran wajib diisi.']);
        }

        $attachment = $request->file('attachment');
        $path = $attachment?->store('message-attachments', 'local');
        $message = DB::transaction(function () use ($conversation, $request, $body, $attachment, $path) {
            $message = $conversation->messages()->create([
                'sender_id' => $request->user()->id,
                'body' => $body !== '' ? $body : null,
                'attachment_path' => $path,
                'attachment_name' => $attachment?->getClientOriginalName(),
                'attachment_mime' => $attachment?->getMimeType(),
                'attachment_size' => $attachment?->getSize(),
            ]);
            $conversation->touch();
            return $message;
        });

        $state->update(['unread_at' => null]);
        event(new MessageSent($message->load('sender:id,name')));

        return response()->json([
            'status' => true,
            'message' => 'Pesan berhasil dikirim.',
            'data' => $this->messageData($message->load('sender:id,name'), $request->user()->id),
        ], 201);
    }

    public function updateArchive(Request $request, Conversation $conversation)
    {
        $conversation = $this->authorizedConversation($request, $conversation);
        $validated = $request->validate(['archived' => 'required|boolean']);
        $this->stateFor($conversation, $request->user()->id)->update([
            'archived_at' => $validated['archived'] ? now() : null,
        ]);

        return response()->json([
            'status' => true,
            'message' => $validated['archived'] ? 'Percakapan berhasil diarsipkan.' : 'Percakapan dikembalikan ke kotak masuk.',
        ]);
    }

    public function markUnread(Request $request, Conversation $conversation)
    {
        $conversation = $this->authorizedConversation($request, $conversation);
        $this->stateFor($conversation, $request->user()->id)->update(['unread_at' => now()]);

        return response()->json(['status' => true, 'message' => 'Percakapan ditandai belum dibaca.']);
    }

    public function markRead(Request $request, Conversation $conversation)
    {
        $conversation = $this->authorizedConversation($request, $conversation);
        $state = $this->stateFor($conversation, $request->user()->id);

        $conversation->messages()
            ->where('sender_id', '!=', $request->user()->id)
            ->whereNull('read_at')
            ->when($state->deleted_at, fn ($query) => $query->where('id', '>', $state->deleted_before_message_id ?? 0))
            ->update(['read_at' => now()]);
        $state->update(['unread_at' => null]);

        return response()->json(['status' => true, 'message' => 'Pesan ditandai sudah dibaca.']);
    }

    public function destroy(Request $request, Conversation $conversation)
    {
        $conversation = $this->authorizedConversation($request, $conversation);
        $state = $this->stateFor($conversation, $request->user()->id);
        $state->update([
            'deleted_at' => now(),
            'deleted_before_message_id' => $conversation->messages()->max('id') ?? 0,
            'archived_at' => null,
            'unread_at' => null,
        ]);

        return response()->json(['status' => true, 'message' => 'Riwayat percakapan berhasil dihapus.']);
    }

    public function downloadAttachment(Request $request, Conversation $conversation, Message $message)
    {
        $conversation = $this->authorizedConversation($request, $conversation);
        abort_unless($message->conversation_id === $conversation->id && $message->attachment_path, 404);
        $state = $this->stateFor($conversation, $request->user()->id);
        abort_unless(!$state->deleted_at || $message->id > ($state->deleted_before_message_id ?? 0), 404);
        abort_unless(Storage::disk('local')->exists($message->attachment_path), 404);

        return Storage::disk('local')->download($message->attachment_path, $message->attachment_name);
    }

    private function ensureAllowedRole(string $role): void
    {
        abort_unless(in_array($role, ['merchant', 'mahasiswa'], true), 403, 'Fitur pesan hanya tersedia untuk merchant dan mahasiswa.');
    }

    private function authorizedConversation(Request $request, Conversation $conversation): Conversation
    {
        $user = $request->user();
        $this->ensureAllowedRole($user->role);
        $conversation->loadMissing('application.jobPost.merchantProfile');
        $application = $conversation->application;
        $isStudent = $user->role === 'mahasiswa' && $application->user_id === $user->id;
        $isMerchant = $user->role === 'merchant' && $application->jobPost->merchantProfile->user_id === $user->id;
        abort_unless($isStudent || $isMerchant, 404);

        return $conversation;
    }

    private function stateFor(Conversation $conversation, int $userId): ConversationUserState
    {
        return ConversationUserState::firstOrCreate([
            'conversation_id' => $conversation->id,
            'user_id' => $userId,
        ]);
    }

    private function conversationSummary(Conversation $conversation, int $userId): array
    {
        $application = $conversation->application;
        $profile = $application->jobPost->merchantProfile;
        $isMerchant = $profile->user_id === $userId;
        $otherUser = $isMerchant ? $application->student : $profile->user;
        $state = $conversation->userStates->firstWhere('user_id', $userId)
            ?? $this->stateFor($conversation, $userId);
        $lastMessage = $conversation->relationLoaded('latestMessage')
            ? $conversation->latestMessage
            : $conversation->messages()
                ->when($state->deleted_at, fn ($query) => $query->where('id', '>', $state->deleted_before_message_id ?? 0))
                ->latest()
                ->first();
        if ($state->deleted_at && $lastMessage && $lastMessage->id <= ($state->deleted_before_message_id ?? 0)) {
            $lastMessage = null;
        }

        if (array_key_exists('unread_count', $conversation->getAttributes())) {
            $unreadCount = (int) $conversation->getAttribute('unread_count');
        } else {
            $unreadCount = $conversation->messages()
                ->when($state->deleted_at, fn ($query) => $query->where('id', '>', $state->deleted_before_message_id ?? 0))
                ->where('sender_id', '!=', $userId)
                ->whereNull('read_at')
                ->count();
        }

        return [
            'id' => $conversation->id,
            'application_id' => $application->id,
            'other_user' => ['id' => $otherUser->id, 'name' => $otherUser->name],
            'merchant_name' => $profile->merchant_name,
            'job_title' => $application->jobPost->title,
            'application_status' => $application->status,
            'last_message' => $lastMessage ? [
                'body' => $lastMessage->body,
                'attachment_name' => $lastMessage->attachment_name,
                'sender_id' => $lastMessage->sender_id,
                'created_at' => $lastMessage->created_at,
                'read_at' => $lastMessage->read_at,
            ] : null,
            'unread_count' => $unreadCount,
            'is_unread' => $unreadCount > 0 || $state->unread_at !== null,
            'is_archived' => $state->archived_at !== null,
            'deleted' => $state->deleted_at !== null && !$lastMessage,
            'search_text' => implode(' ', [$otherUser->name, $profile->merchant_name, $application->jobPost->title]),
            'updated_at' => $lastMessage?->created_at ?? $conversation->updated_at,
        ];
    }

    private function messageData(Message $message, int $userId): array
    {
        return [
            'id' => $message->id,
            'sender_id' => $message->sender_id,
            'sender_name' => $message->sender?->name,
            'body' => $message->body,
            'attachment_name' => $message->attachment_name,
            'attachment_mime' => $message->attachment_mime,
            'attachment_size' => $message->attachment_size,
            'attachment_url' => $message->attachment_path
                ? route('messages.attachment', ['conversation' => $message->conversation_id, 'message' => $message->id])
                : null,
            'created_at' => $message->created_at,
            'read_at' => $message->sender_id === $userId ? $message->read_at : null,
        ];
    }
}
