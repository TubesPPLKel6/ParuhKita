<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\JobCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminReferenceDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_campuses_and_linked_study_programs(): void
    {
        $admin = $this->createUser('admin');
        $this->actingAs($admin, 'sanctum');

        $campusResponse = $this->postJson('/api/v1/admin/reference-data/campuses', [
            'name' => 'Universitas Contoh',
            'city' => 'Yogyakarta',
            'status' => 'active',
        ]);
        $campusResponse->assertCreated()
            ->assertJsonPath('message', 'Kampus berhasil ditambahkan.');
        $campusId = $campusResponse->json('data.id');

        $this->putJson("/api/v1/admin/reference-data/campuses/{$campusId}", [
            'name' => 'Universitas Contoh Baru',
            'city' => 'Sleman',
            'status' => 'inactive',
        ])->assertOk()
            ->assertJsonPath('data.city', 'Sleman')
            ->assertJsonPath('data.status', 'inactive');

        $programResponse = $this->postJson('/api/v1/admin/reference-data/study-programs', [
            'campus_id' => $campusId,
            'name' => 'Informatika',
            'code' => 'UGM-IF',
            'degree_level' => 'S1',
            'status' => 'active',
        ]);
        $programResponse->assertCreated()
            ->assertJsonPath('data.campus.name', 'Universitas Contoh Baru')
            ->assertJsonPath('data.code', 'UGM-IF');
        $programId = $programResponse->json('data.id');

        $this->putJson("/api/v1/admin/reference-data/study-programs/{$programId}", [
            'campus_id' => $campusId,
            'name' => 'Sistem Informasi',
            'code' => 'UGM-SI',
            'degree_level' => 'D4',
            'status' => 'inactive',
        ])->assertOk()
            ->assertJsonPath('data.name', 'Sistem Informasi')
            ->assertJsonPath('data.code', 'UGM-SI')
            ->assertJsonPath('data.degree_level', 'D4')
            ->assertJsonPath('data.status', 'inactive');

        $this->deleteJson("/api/v1/admin/reference-data/campuses/{$campusId}")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Kampus tidak dapat dihapus selama masih memiliki program studi.');

        $this->deleteJson("/api/v1/admin/reference-data/study-programs/{$programId}")
            ->assertOk()
            ->assertJsonPath('message', 'Program studi berhasil dihapus.');

        $this->deleteJson("/api/v1/admin/reference-data/campuses/{$campusId}")
            ->assertOk();
        $this->assertDatabaseMissing('campuses', ['id' => $campusId]);
    }

    public function test_admin_can_manage_job_categories_and_list_reference_data(): void
    {
        $admin = $this->createUser('admin');
        $this->actingAs($admin, 'sanctum');

        $response = $this->postJson('/api/v1/admin/reference-data/job-categories', [
            'name' => 'Layanan Pelanggan',
            'description' => 'Membantu dan melayani pelanggan.',
        ]);
        $response->assertCreated()
            ->assertJsonPath('message', 'Kategori pekerjaan berhasil ditambahkan.')
            ->assertJsonPath('data.status', 'active');
        $categoryId = $response->json('data.id');

        $this->putJson("/api/v1/admin/reference-data/job-categories/{$categoryId}", [
            'name' => 'Customer Service',
            'description' => 'Memberikan dukungan kepada pelanggan.',
            'status' => 'inactive',
        ])->assertOk()
            ->assertJsonPath('data.name', 'Customer Service')
            ->assertJsonPath('data.status', 'inactive');

        $this->getJson('/api/v1/admin/reference-data')
            ->assertOk()
            ->assertJsonPath('data.job_categories.0.name', 'Customer Service');

        $this->deleteJson("/api/v1/admin/reference-data/job-categories/{$categoryId}")
            ->assertOk();
        $this->assertDatabaseMissing('job_categories', ['id' => $categoryId]);
    }

    public function test_reference_data_required_fields_and_relationships_are_validated(): void
    {
        $admin = $this->createUser('admin');
        $this->actingAs($admin, 'sanctum');

        $this->postJson('/api/v1/admin/reference-data/campuses', [
            'name' => '',
            'city' => '',
            'status' => 'unknown',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'city', 'status']);

        $this->postJson('/api/v1/admin/reference-data/study-programs', [
            'campus_id' => 999,
            'name' => '',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['campus_id', 'name']);

        $this->postJson('/api/v1/admin/reference-data/job-categories', [
            'name' => 'Magang',
            'description' => '',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['description']);

        $this->assertDatabaseCount('campuses', 0);
        $this->assertDatabaseCount('study_programs', 0);
        $this->assertDatabaseCount('job_categories', 0);
    }

    public function test_admin_can_save_extended_master_fields_and_manage_job_subcategories(): void
    {
        $admin = $this->createUser('admin');
        $this->actingAs($admin, 'sanctum');

        $campus = $this->postJson('/api/v1/admin/reference-data/campuses', [
            'name' => 'Universitas Data',
            'code' => 'UD',
            'city' => 'Yogyakarta',
            'status' => 'active',
            'accreditation' => 'Unggul',
        ])->assertCreated()
            ->assertJsonPath('data.code', 'UD')
            ->assertJsonPath('data.accreditation', 'Unggul');

        $this->postJson('/api/v1/admin/reference-data/study-programs', [
            'campus_id' => $campus->json('data.id'),
            'name' => 'Sistem Informasi',
            'code' => 'UD-SI',
            'degree_level' => 'S1',
            'status' => 'active',
        ])->assertCreated()
            ->assertJsonPath('data.code', 'UD-SI')
            ->assertJsonPath('data.degree_level', 'S1');

        $category = $this->postJson('/api/v1/admin/reference-data/job-categories', [
            'name' => 'Kuliner',
            'description' => 'Pekerjaan di bidang makanan.',
        ])->assertCreated();
        $subcategory = $this->postJson('/api/v1/admin/reference-data/job-subcategories', [
            'job_category_id' => $category->json('data.id'),
            'name' => 'Barista',
        ])->assertCreated()
            ->assertJsonPath('data.category.name', 'Kuliner');

        $this->putJson("/api/v1/admin/reference-data/job-subcategories/{$subcategory->json('data.id')}", [
            'job_category_id' => $category->json('data.id'),
            'name' => 'Barista Profesional',
        ])->assertOk()
            ->assertJsonPath('data.name', 'Barista Profesional');

        $this->getJson('/api/v1/admin/reference-data')
            ->assertOk()
            ->assertJsonPath('data.job_categories.0.subcategories_count', 1)
            ->assertJsonPath('data.job_subcategories.0.name', 'Barista Profesional');

        $this->deleteJson("/api/v1/admin/reference-data/job-categories/{$category->json('data.id')}")
            ->assertOk();
        $this->assertDatabaseMissing('job_subcategories', ['id' => $subcategory->json('data.id')]);
    }

    public function test_authenticated_merchants_can_read_categories_and_subcategories_for_job_forms(): void
    {
        $category = JobCategory::create([
            'name' => 'Food & Beverage',
            'description' => 'Pekerjaan layanan makanan dan minuman.',
        ]);
        $category->subcategories()->create(['name' => 'Barista']);

        $merchant = $this->createUser('merchant');
        JobCategory::create([
            'name' => 'Kategori Nonaktif',
            'description' => 'Tidak boleh muncul pada formulir lowongan.',
            'status' => 'inactive',
        ]);
        $this->actingAs($merchant, 'sanctum')
            ->getJson('/api/v1/reference/job-categories')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Food & Beverage')
            ->assertJsonPath('data.0.subcategories.0.name', 'Barista')
            ->assertJsonMissing(['name' => 'Kategori Nonaktif']);
    }

    public function test_only_admins_can_access_master_reference_data(): void
    {
        $student = $this->createUser('mahasiswa');
        $this->actingAs($student, 'sanctum')
            ->getJson('/api/v1/admin/reference-data')
            ->assertForbidden();

        $merchant = $this->createUser('merchant');
        $this->actingAs($merchant, 'sanctum')
            ->postJson('/api/v1/admin/reference-data/campuses', [
                'name' => 'Tidak boleh',
                'city' => 'Yogyakarta',
                'status' => 'active',
            ])
            ->assertForbidden();
    }

    private function createUser(string $role): User
    {
        static $sequence = 0;
        $sequence++;

        return User::create([
            'name' => ucfirst($role),
            'email' => "{$role}{$sequence}@example.test",
            'password' => 'password123',
            'role' => $role,
        ]);
    }
}
