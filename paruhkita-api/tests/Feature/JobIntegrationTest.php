<?php

namespace Tests\Feature;

use App\Models\JobCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class JobIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_merchant_job_is_visible_to_students_and_applications_return_to_merchant(): void
    {
        Storage::fake('local');
        $merchant = $this->createUser('merchant', 'merchant-jobs@test.local');
        $merchant->merchantProfile()->create([
            'merchant_name' => 'Kedai Contoh',
            'category' => 'Makanan & Minuman',
            'description' => 'Kedai contoh.',
            'phone' => '081234567890',
            'address' => 'Yogyakarta',
            'is_verified' => true,
            'verification_status' => 'approved',
        ]);
        $student = $this->createUser('mahasiswa', 'student-jobs@test.local');
        JobCategory::create([
            'name' => 'Food & Beverage',
            'description' => 'Pekerjaan kuliner.',
            'status' => 'active',
        ]);

        $job = $this->actingAs($merchant, 'sanctum')
            ->postJson('/api/v1/merchant/jobs', [
                'title' => 'Barista Paruh Waktu',
                'category' => 'Food & Beverage',
                'subcategory' => null,
                'schedule' => 'Senin-Jumat sore',
                'location' => 'Yogyakarta',
                'wage' => 'Rp25.000/jam',
                'quota' => 2,
                'description' => 'Melayani pelanggan.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Barista Paruh Waktu')
            ->json('data');

        $this->putJson("/api/v1/merchant/jobs/{$job['id']}", [
            'title' => 'Barista Sore',
            'category' => 'Food & Beverage',
            'subcategory' => null,
            'schedule' => 'Senin-Jumat sore',
            'location' => 'Yogyakarta',
            'wage' => 'Rp26.000/jam',
            'quota' => 2,
            'description' => 'Melayani pelanggan.',
        ])->assertOk()
            ->assertJsonPath('data.title', 'Barista Sore');

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/v1/jobs')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Barista Sore')
            ->assertJsonPath('data.0.merchant_profile.merchant_name', 'Kedai Contoh')
            ->assertJsonPath('data.0.is_applied', false);

        $this->post("/api/v1/jobs/{$job['id']}/applications", $this->validApplicationData())
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending');

        $this->getJson('/api/v1/student/applications')
            ->assertOk()
            ->assertJsonPath('data.0.job_post.title', 'Barista Sore')
            ->assertJsonPath('data.0.job_post.merchant_profile.merchant_name', 'Kedai Contoh')
            ->assertJsonCount(2, 'data.0.documents')
            ->assertJsonPath('data.0.status_histories.0.status', 'submitted')
            ->assertJsonPath('data.0.status_histories.2.status', 'pending');

        $applicationId = $this->actingAs($merchant, 'sanctum')
            ->getJson('/api/v1/merchant/jobs')
            ->assertOk()
            ->assertJsonPath('data.0.applications.0.student.name', $student->name)
            ->json('data.0.applications.0.id');

        $this->patchJson("/api/v1/merchant/applications/{$applicationId}", [
            'status' => 'interview',
        ])->assertOk()->assertJsonPath('data.status', 'interview');

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/v1/student/applications')
            ->assertJsonPath('data.0.status', 'interview');

        $this->actingAs($merchant, 'sanctum')
            ->deleteJson("/api/v1/merchant/jobs/{$job['id']}")
            ->assertOk();
        $this->actingAs($student, 'sanctum')
            ->getJson('/api/v1/student/applications')
            ->assertJsonCount(1, 'data');
        $this->assertDatabaseHas('job_posts', ['id' => $job['id'], 'status' => 'archived']);
    }

    public function test_students_cannot_apply_twice_and_unverified_merchants_cannot_publish(): void
    {
        Storage::fake('local');
        $merchant = $this->createUser('merchant', 'unverified@test.local');
        $merchant->merchantProfile()->create([
            'merchant_name' => 'Belum Terverifikasi',
            'category' => 'Retail',
            'is_verified' => false,
            'verification_status' => 'pending',
        ]);
        $this->actingAs($merchant, 'sanctum')
            ->postJson('/api/v1/merchant/jobs', [
                'title' => 'Kasir',
                'category' => 'Retail',
                'schedule' => 'Sore',
                'location' => 'Yogyakarta',
                'wage' => 'Rp20.000/jam',
                'quota' => 1,
            ])
            ->assertForbidden();

        $verifiedMerchant = $this->createUser('merchant', 'verified@test.local');
        $profile = $verifiedMerchant->merchantProfile()->create([
            'merchant_name' => 'Terverifikasi',
            'category' => 'Retail',
            'is_verified' => true,
            'verification_status' => 'approved',
        ]);
        $category = JobCategory::create([
            'name' => 'Retail',
            'description' => 'Pekerjaan retail.',
            'status' => 'active',
        ]);
        $job = $profile->jobPosts()->create([
            'title' => 'Kasir',
            'category' => $category->name,
            'schedule' => 'Sore',
            'wage' => 'Rp20.000/jam',
            'location' => 'Yogyakarta',
            'quota' => 1,
        ]);

        $student = $this->createUser('mahasiswa', 'applicant@test.local');
        $this->actingAs($student, 'sanctum')
            ->post("/api/v1/jobs/{$job->id}/applications", $this->validApplicationData())
            ->assertCreated();
        $this->postJson("/api/v1/jobs/{$job->id}/applications", ['motivation' => 'Saya tertarik dengan pekerjaan ini dan siap berkontribusi.'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('job');
    }

    public function test_merchant_job_requires_positive_quota_and_valid_deadline(): void
    {
        $merchant = $this->createUser('merchant', 'validation@test.local');
        $merchant->merchantProfile()->create([
            'merchant_name' => 'Merchant Validasi',
            'is_verified' => true,
            'verification_status' => 'approved',
        ]);
        JobCategory::create([
            'name' => 'Retail',
            'description' => 'Pekerjaan retail.',
            'status' => 'active',
        ]);

        $this->actingAs($merchant, 'sanctum')
            ->postJson('/api/v1/merchant/jobs', [
                'title' => 'Kasir',
                'category' => 'Retail',
                'schedule' => 'Sore',
                'location' => 'Yogyakarta',
                'wage' => 'Rp20.000/jam',
                'quota' => 0,
                'application_deadline' => now()->subDay()->toDateString(),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['quota', 'application_deadline']);
    }

    private function validApplicationData(): array
    {
        return [
            'motivation' => 'Saya tertarik dengan pekerjaan ini dan siap berkontribusi.',
            'cv' => UploadedFile::fake()->create('CV.pdf', 200, 'application/pdf'),
            'student_id' => UploadedFile::fake()->create('KTM.pdf', 200, 'application/pdf'),
        ];
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
