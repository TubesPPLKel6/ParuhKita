<?php

namespace Tests\Feature;

use App\Models\MerchantProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MerchantVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_merchant_can_submit_required_documents_for_admin_review(): void
    {
        Storage::fake('local');
        $merchant = User::create([
            'name' => 'Toko Contoh',
            'email' => 'merchant@example.test',
            'password' => 'password123',
            'role' => 'merchant',
        ]);
        $profile = MerchantProfile::create([
            'user_id' => $merchant->id,
            'merchant_name' => $merchant->name,
        ]);

        $response = $this->actingAs($merchant, 'sanctum')->post('/api/v1/merchant/verification', [
            'ktp' => UploadedFile::fake()->create('ktp.pdf', 20, 'application/pdf'),
            'nib' => UploadedFile::fake()->create('nib.pdf', 20, 'application/pdf'),
            'business_license' => UploadedFile::fake()->create('license.pdf', 20, 'application/pdf'),
            'store_photo' => UploadedFile::fake()->create('store.jpg', 20, 'image/jpeg'),
            'npwp' => UploadedFile::fake()->create('npwp.pdf', 20, 'application/pdf'),
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.verification_status', 'pending');
        $this->assertDatabaseCount('merchant_verification_documents', 5);
        $this->assertDatabaseHas('merchant_profiles', [
            'id' => $profile->id,
            'verification_status' => 'pending',
            'is_verified' => false,
        ]);
    }

    public function test_only_admin_can_approve_a_pending_merchant_verification(): void
    {
        $merchant = User::create([
            'name' => 'Toko Contoh',
            'email' => 'merchant@example.test',
            'password' => 'password123',
            'role' => 'merchant',
        ]);
        $profile = MerchantProfile::create([
            'user_id' => $merchant->id,
            'merchant_name' => $merchant->name,
            'verification_status' => 'pending',
        ]);
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.test',
            'password' => 'password123',
            'role' => 'admin',
        ]);

        $this->actingAs($merchant, 'sanctum')
            ->postJson("/api/v1/admin/merchant-verifications/{$profile->id}/approve")
            ->assertForbidden();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/merchant-verifications/{$profile->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.is_verified', true)
            ->assertJsonPath('data.verification_status', 'approved');
    }
}
