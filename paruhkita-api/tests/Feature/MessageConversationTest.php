<?php

namespace Tests\Feature;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\JobPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MessageConversationTest extends TestCase
{
    use RefreshDatabase;

    public function test_related_merchant_and_student_can_message_and_manage_their_conversation(): void
    {
        Storage::fake('local');
        [$merchant, $student, $application] = $this->createRecruitment();
        $conversation = Conversation::create(['job_application_id' => $application->id]);

        $this->actingAs($student, 'sanctum')
            ->postJson("/api/v1/messages/{$conversation->id}/messages", ['body' => 'Halo, saya ingin bertanya tentang jadwal kerja.'])
            ->assertCreated()
            ->assertJsonPath('data.body', 'Halo, saya ingin bertanya tentang jadwal kerja.');
        $sentMessage = $conversation->messages()->firstOrFail();
        $broadcast = new MessageSent($sentMessage->load('sender:id,name'));
        $this->assertDatabaseCount('jobs', 1);
        $this->assertSame("private-conversations.{$conversation->id}", $broadcast->broadcastOn()[0]->name);
        $this->assertSame($sentMessage->body, $broadcast->broadcastWith()['body']);

        $this->actingAs($merchant, 'sanctum')
            ->getJson('/api/v1/messages?filter=unread')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.other_user.name', $student->name)
            ->assertJsonPath('data.0.job_title', 'Barista Paruh Waktu')
            ->assertJsonPath('data.0.is_unread', true);

        $this->getJson("/api/v1/messages/{$conversation->id}")
            ->assertOk()
            ->assertJsonPath('data.messages.0.body', 'Halo, saya ingin bertanya tentang jadwal kerja.');
        $this->assertNotNull($conversation->messages()->first()->fresh()->read_at);

        $this->actingAs($student, 'sanctum')
            ->postJson("/api/v1/messages/{$conversation->id}/messages", [
                'attachment' => UploadedFile::fake()->create('portofolio.pdf', 100, 'application/pdf'),
            ])
            ->assertCreated()
            ->assertJsonPath('data.attachment_name', 'portofolio.pdf')
            ->assertJsonPath('data.attachment_mime', 'application/pdf');

        $this->patchJson("/api/v1/messages/{$conversation->id}/unread")->assertOk();
        $this->getJson('/api/v1/messages?filter=unread')->assertJsonCount(1, 'data');
        $this->patchJson("/api/v1/messages/{$conversation->id}/archive", ['archived' => true])->assertOk();
        $this->getJson('/api/v1/messages?filter=archived')->assertJsonCount(1, 'data');
        $this->deleteJson("/api/v1/messages/{$conversation->id}")->assertOk();
        $this->getJson('/api/v1/messages?filter=archived')->assertJsonCount(0, 'data');
        $this->postJson("/api/v1/messages/{$conversation->id}/messages", ['body' => 'Pesan baru setelah riwayat dihapus.'])
            ->assertCreated();
        $this->getJson("/api/v1/messages/{$conversation->id}")
            ->assertJsonCount(1, 'data.messages')
            ->assertJsonPath('data.messages.0.body', 'Pesan baru setelah riwayat dihapus.');
    }

    public function test_only_application_participants_can_authorize_the_private_conversation_channel(): void
    {
        [$merchant, $student, $application] = $this->createRecruitment();
        $conversation = Conversation::create(['job_application_id' => $application->id]);
        $otherStudent = $this->createUser('mahasiswa', 'other-channel-student@test.local');
        $payload = [
            'socket_id' => '123.456',
            'channel_name' => "private-conversations.{$conversation->id}",
        ];

        $this->actingAs($student, 'sanctum')
            ->postJson('/api/broadcasting/auth', $payload)
            ->assertOk();

        $this->actingAs($merchant, 'sanctum')
            ->postJson('/api/broadcasting/auth', $payload)
            ->assertOk();

        $this->actingAs($otherStudent, 'sanctum')
            ->postJson('/api/broadcasting/auth', $payload)
            ->assertForbidden();
    }

    public function test_empty_messages_and_users_unrelated_to_the_application_are_rejected(): void
    {
        [$merchant, $student, $application] = $this->createRecruitment();
        $conversation = Conversation::create(['job_application_id' => $application->id]);
        $otherStudent = $this->createUser('mahasiswa', 'other-student@test.local');

        $this->actingAs($student, 'sanctum')
            ->postJson("/api/v1/messages/{$conversation->id}/messages", ['body' => '   '])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('body');

        $this->actingAs($otherStudent, 'sanctum')
            ->getJson("/api/v1/messages/{$conversation->id}")
            ->assertNotFound();

        $this->actingAs($merchant, 'sanctum')
            ->postJson("/api/v1/messages/{$conversation->id}/messages", ['body' => 'Balasan merchant.'])
            ->assertCreated();
    }

    private function createRecruitment(): array
    {
        $merchant = $this->createUser('merchant', 'merchant-message@test.local');
        $profile = $merchant->merchantProfile()->create([
            'merchant_name' => 'Kopi Sela',
            'category' => 'Makanan & Minuman',
            'address' => 'Yogyakarta',
        ]);
        $student = $this->createUser('mahasiswa', 'student-message@test.local');
        $job = JobPost::create([
            'merchant_profile_id' => $profile->id,
            'title' => 'Barista Paruh Waktu',
            'category' => 'Makanan & Minuman',
            'schedule' => 'Sore',
            'wage' => 'Rp25.000/jam',
            'quota' => 2,
            'status' => 'active',
        ]);
        $application = $job->applications()->create(['user_id' => $student->id, 'status' => 'pending']);

        return [$merchant, $student, $application];
    }

    private function createUser(string $role, string $email): User
    {
        return User::create([
            'name' => ucfirst($role) . ' Contoh',
            'email' => $email,
            'password' => Hash::make('password123'),
            'role' => $role,
        ]);
    }
}
