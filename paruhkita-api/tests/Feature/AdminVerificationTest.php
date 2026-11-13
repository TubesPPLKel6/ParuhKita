<?php

namespace Tests\Feature;

use App\Models\MerchantProfile;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_submit_ktm_for_verification(): void
    {
        Storage::fake('local');
        $student = User::create(['name' => 'Budi Mahasiswa', 'email' => 'student@example.test', 'password' => 'password123', 'role' => 'mahasiswa']);
        StudentProfile::create(['user_id' => $student->id, 'university' => 'Universitas Contoh', 'major' => 'Informatika']);

        $this->actingAs($student, 'sanctum')->post('/api/v1/student/verification', [
            'nim' => '2201010045',
            'ktm_file' => UploadedFile::fake()->create('ktm.pdf', 20, 'application/pdf'),
        ])->assertCreated()->assertJsonPath('data.verification_status', 'pending');

        $this->assertDatabaseHas('student_profiles', ['user_id' => $student->id, 'nim' => '2201010045', 'verification_status' => 'pending']);
    }

    public function test_admin_can_list_and_request_revision_for_unified_verification(): void
    {
        $student = User::create(['name' => 'Budi Mahasiswa', 'email' => 'student@example.test', 'password' => 'password123', 'role' => 'mahasiswa']);
        $profile = StudentProfile::create([
            'user_id' => $student->id,
            'university' => 'Universitas Contoh',
            'major' => 'Informatika',
            'nim' => '2201010045',
            'ktm_file_path' => 'student-verification/1/ktm.pdf',
            'verification_status' => 'pending',
            'verification_submitted_at' => now(),
        ]);
        $admin = User::create(['name' => 'Admin', 'email' => 'admin@example.test', 'password' => 'password123', 'role' => 'admin']);

        $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/verifications?type=student&status=pending')
            ->assertOk()->assertJsonPath('data.0.entity_type', 'student')->assertJsonPath('meta.stats.total_pending', 1);

        $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/verifications/student/{$profile->id}/request-revision", ['notes' => 'Foto KTM buram.'])
            ->assertOk()->assertJsonPath('data.verification_status', 'revision_required');
    }

    public function test_admin_can_batch_approve_student_and_merchant(): void
    {
        $student = User::create(['name' => 'Budi Mahasiswa', 'email' => 'student@example.test', 'password' => 'password123', 'role' => 'mahasiswa']);
        $studentProfile = StudentProfile::create(['user_id' => $student->id, 'nim' => '2201010045', 'ktm_file_path' => 'student/ktm.pdf', 'verification_status' => 'pending']);
        $merchant = User::create(['name' => 'Toko Contoh', 'email' => 'merchant@example.test', 'password' => 'password123', 'role' => 'merchant']);
        $merchantProfile = MerchantProfile::create(['user_id' => $merchant->id, 'merchant_name' => 'Toko Contoh', 'verification_status' => 'pending']);
        $admin = User::create(['name' => 'Admin', 'email' => 'admin@example.test', 'password' => 'password123', 'role' => 'admin']);

        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/verifications/batch-approve', ['items' => [
            ['type' => 'student', 'id' => $studentProfile->id],
            ['type' => 'merchant', 'id' => $merchantProfile->id],
        ]])->assertOk()->assertJsonPath('approved_count', 2);

        $this->assertDatabaseHas('student_profiles', ['id' => $studentProfile->id, 'verification_status' => 'approved', 'is_verified' => true]);
        $this->assertDatabaseHas('merchant_profiles', ['id' => $merchantProfile->id, 'verification_status' => 'approved', 'is_verified' => true]);
    }
}
