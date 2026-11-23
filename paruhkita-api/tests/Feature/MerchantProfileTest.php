<?php

namespace Tests\Feature;

use App\Models\MerchantProfile;
use App\Models\MerchantVerificationDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MerchantProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_merchant_can_read_and_update_own_profile(): void
    {
        $merchant = $this->createMerchant();
        $profile = MerchantProfile::create([
            'user_id' => $merchant->id,
            'merchant_name' => 'Toko Lama',
        ]);

        $this->actingAs($merchant, 'sanctum')
            ->getJson('/api/v1/merchant/profile')
            ->assertOk()
            ->assertJsonPath('data.merchant_name', 'Toko Lama');

        $this->putJson('/api/v1/merchant/profile', [
            'merchant_name' => 'Toko Baru',
            'category' => 'Retail',
            'description' => 'Deskripsi usaha',
            'phone' => '08123456789',
            'email' => 'updated@example.test',
            'address' => 'Yogyakarta',
            'facilities' => [
                [
                    'name' => 'Kantin',
                    'category' => 'dining',
                    'description' => 'Makan siang tersedia',
                ],
                [
                    'name' => 'Tempat ibadah',
                    'category' => 'worship',
                    'description' => null,
                ],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.merchant_name', 'Toko Baru')
            ->assertJsonPath('data.user.email', 'updated@example.test')
            ->assertJsonPath('data.facilities.0.name', 'Kantin');

        $this->assertDatabaseHas('merchant_profiles', [
            'id' => $profile->id,
            'category' => 'Retail',
            'address' => 'Yogyakarta',
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $merchant->id,
            'name' => 'Toko Baru',
            'email' => 'updated@example.test',
        ]);
        $this->assertDatabaseHas('merchant_profile_facilities', [
            'merchant_profile_id' => $profile->id,
            'name' => 'Kantin',
            'category' => 'dining',
        ]);

        $this->actingAs($merchant, 'sanctum')
            ->getJson('/api/v1/merchant/profile')
            ->assertOk()
            ->assertJsonCount(2, 'data.facilities');
    }

    public function test_merchant_can_update_and_remove_workplace_facilities(): void
    {
        $merchant = $this->createMerchant();
        $profile = MerchantProfile::create([
            'user_id' => $merchant->id,
            'merchant_name' => 'Toko Contoh',
        ]);
        $facility = $profile->facilities()->create([
            'name' => 'Antar jemput',
            'category' => 'transportation',
        ]);

        $this->actingAs($merchant, 'sanctum')
            ->putJson('/api/v1/merchant/profile', $this->validProfileData([
                'facilities' => [[
                    'name' => 'Uang transport',
                    'category' => 'transportation',
                    'description' => 'Tunjangan transportasi bulanan',
                ]],
            ]))
            ->assertOk()
            ->assertJsonPath('data.facilities.0.name', 'Uang transport');

        $this->assertDatabaseMissing('merchant_profile_facilities', ['id' => $facility->id]);
        $this->assertDatabaseHas('merchant_profile_facilities', [
            'merchant_profile_id' => $profile->id,
            'name' => 'Uang transport',
        ]);

        $this->putJson('/api/v1/merchant/profile', $this->validProfileData(['facilities' => []]))
            ->assertOk()
            ->assertJsonCount(0, 'data.facilities');
        $this->assertDatabaseCount('merchant_profile_facilities', 0);
    }

    public function test_profile_form_data_can_save_facility_json(): void
    {
        $merchant = $this->createMerchant();
        $this->actingAs($merchant, 'sanctum')
            ->post('/api/v1/merchant/profile', [
                '_method' => 'PUT',
                'merchant_name' => 'Toko Form',
                'category' => 'Retail',
                'description' => 'Deskripsi usaha',
                'phone' => '08123456789',
                'address' => 'Yogyakarta',
                'email' => $merchant->email,
                'facilities' => json_encode([[
                    'name' => 'Antar jemput',
                    'category' => 'transportation',
                    'description' => 'Tersedia untuk shift malam',
                ]]),
            ])
            ->assertOk()
            ->assertJsonPath('data.facilities.0.name', 'Antar jemput');
    }

    public function test_company_details_are_readable_without_authentication(): void
    {
        $merchant = $this->createMerchant();
        $profile = MerchantProfile::create([
            'user_id' => $merchant->id,
            'merchant_name' => 'Toko Publik',
            'description' => 'Profil yang dapat dibaca mahasiswa.',
            'phone' => '08123456789',
            'address' => 'Yogyakarta',
            'is_verified' => true,
        ]);
        $profile->facilities()->create([
            'name' => 'Kantin',
            'category' => 'dining',
        ]);

        $this->getJson("/api/v1/companies/{$profile->id}")
            ->assertOk()
            ->assertJsonPath('data.merchant_name', 'Toko Publik')
            ->assertJsonPath('data.is_verified', true)
            ->assertJsonPath('data.email', $merchant->email)
            ->assertJsonPath('data.facilities.0.name', 'Kantin');
    }

    public function test_required_company_profile_fields_are_validated(): void
    {
        $merchant = $this->createMerchant();

        $this->actingAs($merchant, 'sanctum')
            ->putJson('/api/v1/merchant/profile', [
                'merchant_name' => 'Toko Contoh',
                'category' => 'Retail',
                'email' => $merchant->email,
                'facilities' => [],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['description', 'phone', 'address']);

        $this->assertDatabaseCount('merchant_profiles', 0);
    }

    public function test_merchant_can_recreate_a_deleted_profile_and_delete_only_the_profile(): void
    {
        Storage::fake('local');
        $merchant = $this->createMerchant();
        $profile = MerchantProfile::create([
            'user_id' => $merchant->id,
            'merchant_name' => 'Toko Lama',
        ]);
        Storage::disk('local')->put('merchant-verification/1/ktp.pdf', 'document');
        MerchantVerificationDocument::create([
            'merchant_profile_id' => $profile->id,
            'document_type' => 'ktp',
            'file_path' => 'merchant-verification/1/ktp.pdf',
            'original_name' => 'ktp.pdf',
        ]);

        $this->actingAs($merchant, 'sanctum')
            ->deleteJson('/api/v1/merchant/profile')
            ->assertOk()
            ->assertJsonPath('status', true);

        $this->assertDatabaseMissing('merchant_profiles', ['id' => $profile->id]);
        $this->assertDatabaseHas('users', ['id' => $merchant->id]);
        Storage::disk('local')->assertMissing('merchant-verification/1/ktp.pdf');

        $this->putJson('/api/v1/merchant/profile', [
            'merchant_name' => 'Toko Baru',
            'category' => 'Makanan & Minuman',
            'description' => 'Deskripsi usaha',
            'phone' => '08123456789',
            'address' => 'Yogyakarta',
            'email' => $merchant->email,
            'facilities' => [],
        ])
            ->assertOk()
            ->assertJsonPath('data.merchant_name', 'Toko Baru')
            ->assertJsonPath('data.is_verified', false);
    }

    public function test_non_merchants_cannot_access_merchant_profile(): void
    {
        $student = User::create([
            'name' => 'Student',
            'email' => 'student@example.test',
            'password' => 'password123',
            'role' => 'mahasiswa',
        ]);

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/v1/merchant/profile')
            ->assertForbidden();
    }

    private function createMerchant(): User
    {
        return User::create([
            'name' => 'Toko Contoh',
            'email' => 'merchant@example.test',
            'password' => 'password123',
            'role' => 'merchant',
        ]);
    }

    private function validProfileData(array $overrides = []): array
    {
        return array_merge([
            'merchant_name' => 'Toko Contoh',
            'category' => 'Retail',
            'description' => 'Deskripsi usaha',
            'phone' => '08123456789',
            'address' => 'Yogyakarta',
            'email' => 'merchant@example.test',
            'facilities' => [],
        ], $overrides);
    }
}
