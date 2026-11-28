<?php

namespace Tests\Feature;

use App\Events\ActivityLogCreated;
use App\Models\ActivityLog;
use App\Models\Campus;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_mahasiswa_only_sees_own_activity_logs(): void
    {
        $mhs1 = User::factory()->create(['role' => 'mahasiswa']);
        $mhs2 = User::factory()->create(['role' => 'mahasiswa']);

        ActivityLogService::log($mhs1->id, 'mahasiswa', 'create', 'Mengirim lamaran Barista', 'JobApplication', 1);
        ActivityLogService::log($mhs2->id, 'mahasiswa', 'update', 'Memperbarui profil mhs2', 'StudentProfile', 2);

        $response = $this->actingAs($mhs1, 'sanctum')->getJson('/api/v1/activity-logs');

        $response->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.description', 'Mengirim lamaran Barista');
    }

    public function test_merchant_only_sees_own_activity_logs(): void
    {
        $merchant1 = User::factory()->create(['role' => 'merchant']);
        $merchant2 = User::factory()->create(['role' => 'merchant']);

        ActivityLogService::log($merchant1->id, 'merchant', 'create', 'Menambahkan lowongan Kasir', 'JobPost', 1);
        ActivityLogService::log($merchant2->id, 'merchant', 'delete', 'Menghapus lowongan lain', 'JobPost', 2);

        $response = $this->actingAs($merchant1, 'sanctum')->getJson('/api/v1/activity-logs');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.description', 'Menambahkan lowongan Kasir');
    }

    public function test_admin_sees_admin_logs_only_and_can_filter(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $mhs = User::factory()->create(['role' => 'mahasiswa']);

        ActivityLogService::log($admin->id, 'admin', 'create', 'Menambahkan data kampus UNY', 'Campus', 1);
        ActivityLogService::log($admin->id, 'admin', 'update', 'Memperbarui kategori Administrasi', 'JobCategory', 1);
        ActivityLogService::log($mhs->id, 'mahasiswa', 'create', 'Aktivitas mahasiswa biasa', 'JobApplication', 1);

        $allAdmin = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/activity-logs');
        $allAdmin->assertOk()->assertJsonCount(2, 'data');

        $filtered = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/activity-logs?action_type=create&search=UNY');
        $filtered->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.description', 'Menambahkan data kampus UNY');
    }

    public function test_activity_log_endpoints_are_strictly_read_only(): void
    {
        $user = User::factory()->create(['role' => 'mahasiswa']);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/activity-logs', [])->assertStatus(405);
        $this->actingAs($user, 'sanctum')->putJson('/api/v1/activity-logs/1', [])->assertStatus(404);
        $this->actingAs($user, 'sanctum')->deleteJson('/api/v1/activity-logs/1')->assertStatus(404);
    }

    public function test_admin_campus_crud_automatically_records_and_broadcasts_activity_log(): void
    {
        Event::fake([ActivityLogCreated::class]);
        $admin = User::factory()->create(['role' => 'admin']);

        $res = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/reference-data/campuses', [
            'name' => 'Universitas Negeri Yogyakarta',
            'code' => 'UNY',
            'city' => 'Yogyakarta',
            'status' => 'active',
        ]);

        $res->assertCreated();
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $admin->id,
            'role' => 'admin',
            'action_type' => 'create',
            'description' => 'Menambahkan data kampus Universitas Negeri Yogyakarta',
        ]);

        Event::assertDispatched(ActivityLogCreated::class);
    }
}
