<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\MerchantProfile;
use App\Models\QuickReplyTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class QuickReplyTemplateTest extends TestCase
{
    use RefreshDatabase;

    public function test_merchant_can_crud_filter_and_paginate_quick_reply_templates(): void
    {
        [$merchantUser, $merchantProfile] = $this->createMerchant('kopi-sela@test.local', 'Kopi Sela');

        // Create
        $createResponse = $this->actingAs($merchantUser, 'sanctum')
            ->postJson('/api/v1/merchant/quick-reply-templates', [
                'title' => 'Undangan Wawancara',
                'category' => 'Undangan Wawancara',
                'body' => 'Halo {nama_pelamar}, kami mengundang Anda untuk wawancara posisi {posisi_lowongan} di {nama_usaha}.',
                'is_active' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.title', 'Undangan Wawancara')
            ->assertJsonPath('data.is_active', true);

        $templateId = $createResponse->json('data.id');

        // Create inactive template
        $this->actingAs($merchantUser, 'sanctum')
            ->postJson('/api/v1/merchant/quick-reply-templates', [
                'title' => 'Posisi Terisi',
                'category' => 'Umum',
                'body' => 'Terima kasih telah melamar di {nama_usaha}.',
                'is_active' => false,
            ])
            ->assertCreated();

        // Index with filters
        $this->actingAs($merchantUser, 'sanctum')
            ->getJson('/api/v1/merchant/quick-reply-templates')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2);

        $this->actingAs($merchantUser, 'sanctum')
            ->getJson('/api/v1/merchant/quick-reply-templates?status=active')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Undangan Wawancara');

        $this->actingAs($merchantUser, 'sanctum')
            ->getJson('/api/v1/merchant/quick-reply-templates?category=Umum&q=melamar')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Posisi Terisi');

        // Active endpoint only returns active templates
        $this->actingAs($merchantUser, 'sanctum')
            ->getJson('/api/v1/merchant/quick-reply-templates/active')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $templateId);

        // Update
        $this->actingAs($merchantUser, 'sanctum')
            ->putJson("/api/v1/merchant/quick-reply-templates/{$templateId}", [
                'title' => 'Undangan Wawancara Online',
                'category' => 'Undangan Wawancara',
                'body' => 'Halo {nama_pelamar}, wawancara online untuk {posisi_lowongan} di {nama_usaha}.',
                'is_active' => true,
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Undangan Wawancara Online');

        // Delete
        $this->actingAs($merchantUser, 'sanctum')
            ->deleteJson("/api/v1/merchant/quick-reply-templates/{$templateId}")
            ->assertOk();

        $this->assertDatabaseMissing('quick_reply_templates', ['id' => $templateId]);
        $this->assertSame(1, QuickReplyTemplate::where('merchant_profile_id', $merchantProfile->id)->count());
    }

    public function test_validation_rejects_missing_or_invalid_fields(): void
    {
        [$merchantUser] = $this->createMerchant('val-merchant@test.local', 'Kedai Satu');

        $this->actingAs($merchantUser, 'sanctum')
            ->postJson('/api/v1/merchant/quick-reply-templates', [
                'title' => '',
                'category' => 'Kategori Tidak Valid',
                'body' => '',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'category', 'body', 'is_active']);
    }

    public function test_only_owner_merchant_can_access_and_manage_templates(): void
    {
        [$merchantA, $profileA] = $this->createMerchant('merchant-a@test.local', 'Merchant A');
        [$merchantB] = $this->createMerchant('merchant-b@test.local', 'Merchant B');
        $student = User::create([
            'name' => 'Budi Santoso',
            'email' => 'student-q@test.local',
            'password' => Hash::make('password123'),
            'role' => 'mahasiswa',
        ]);

        $templateA = QuickReplyTemplate::create([
            'merchant_profile_id' => $profileA->id,
            'title' => 'Salam Pembuka',
            'category' => 'Umum',
            'body' => 'Halo {nama_pelamar}',
            'is_active' => true,
        ]);

        // Unauthenticated
        $this->getJson('/api/v1/merchant/quick-reply-templates')->assertUnauthorized();

        // Student forbidden
        $this->actingAs($student, 'sanctum')
            ->getJson('/api/v1/merchant/quick-reply-templates')
            ->assertForbidden();

        // Other merchant cannot see in list or update/delete
        $this->actingAs($merchantB, 'sanctum')
            ->getJson('/api/v1/merchant/quick-reply-templates')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->actingAs($merchantB, 'sanctum')
            ->putJson("/api/v1/merchant/quick-reply-templates/{$templateA->id}", [
                'title' => 'Hijack',
                'category' => 'Umum',
                'body' => 'Hack',
                'is_active' => true,
            ])
            ->assertForbidden();

        $this->actingAs($merchantB, 'sanctum')
            ->deleteJson("/api/v1/merchant/quick-reply-templates/{$templateA->id}")
            ->assertForbidden();
    }

    public function test_deleting_template_does_not_affect_sent_chat_messages(): void
    {
        [$merchantUser, $profile] = $this->createMerchant('chat-merchant@test.local', 'Kopi Sela');
        $student = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi-chat@test.local',
            'password' => Hash::make('password123'),
            'role' => 'mahasiswa',
        ]);

        $jobPost = JobPost::create([
            'merchant_profile_id' => $profile->id,
            'title' => 'Barista Paruh Waktu',
            'category' => 'Food & Beverage',
            'location' => 'Bandung',
            'schedule' => 'Senin - Jumat, 09:00 - 14:00',
            'wage' => 'Rp 25.000/jam',
            'quota' => 2,
            'description' => 'Membuat kopi',
            'status' => 'active',
        ]);

        $application = JobApplication::create([
            'job_post_id' => $jobPost->id,
            'user_id' => $student->id,
            'status' => 'pending',
        ]);

        $conversation = Conversation::create(['job_application_id' => $application->id]);

        $template = QuickReplyTemplate::create([
            'merchant_profile_id' => $profile->id,
            'title' => 'Undangan Wawancara',
            'category' => 'Undangan Wawancara',
            'body' => 'Halo {nama_pelamar}, wawancara di {nama_usaha}.',
            'is_active' => true,
        ]);

        $this->actingAs($merchantUser, 'sanctum')
            ->postJson("/api/v1/messages/{$conversation->id}/messages", [
                'body' => 'Halo Budi Santoso, wawancara di Kopi Sela.',
            ])
            ->assertCreated();

        $this->actingAs($merchantUser, 'sanctum')
            ->deleteJson("/api/v1/merchant/quick-reply-templates/{$template->id}")
            ->assertOk();

        $this->actingAs($merchantUser, 'sanctum')
            ->getJson("/api/v1/messages/{$conversation->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.messages')
            ->assertJsonPath('data.messages.0.body', 'Halo Budi Santoso, wawancara di Kopi Sela.');
    }

    private function createMerchant(string $email, string $merchantName): array
    {
        $user = User::create([
            'name' => $merchantName,
            'email' => $email,
            'password' => Hash::make('password123'),
            'role' => 'merchant',
        ]);

        $profile = MerchantProfile::create([
            'user_id' => $user->id,
            'merchant_name' => $merchantName,
            'category' => 'F&B',
            'description' => 'Usaha kopi',
            'phone' => '08123456789',
            'address' => 'Yogyakarta',
            'is_verified' => true,
        ]);

        return [$user, $profile];
    }
}
