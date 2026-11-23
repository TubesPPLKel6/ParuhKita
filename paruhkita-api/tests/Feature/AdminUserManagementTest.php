<?php

namespace Tests\Feature;

use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_filter_view_and_update_account_access(): void
    {
        $admin = $this->createUser('admin', 'admin@example.test');
        $student = $this->createUser('mahasiswa', 'student@example.test');
        StudentProfile::create([
            'user_id' => $student->id,
            'university' => 'Universitas Contoh',
            'major' => 'Informatika',
            'verification_status' => 'pending',
        ]);
        $student->createToken('student-session');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/users?role=mahasiswa&status=active')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.stats.total', 2)
            ->assertJsonPath('meta.stats.mahasiswa', 1)
            ->assertJsonPath('data.0.role', 'mahasiswa')
            ->assertJsonPath('data.0.name', 'Mahasiswa Contoh')
            ->assertJsonPath('data.0.account_status', 'active');

        $this->getJson('/api/v1/admin/users?verification=pending')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.student_profile.verification_status', 'pending');

        $this->getJson('/api/v1/admin/users?institution=Universitas%20Contoh')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.student_profile.university', 'Universitas Contoh');

        $this->getJson("/api/v1/admin/users/{$student->id}")
            ->assertOk()
            ->assertJsonPath('data.student_profile.university', 'Universitas Contoh')
            ->assertJsonPath('data.student_profile.verification_status', 'pending');

        $this->patchJson("/api/v1/admin/users/{$student->id}", [
            'role' => 'merchant',
            'account_status' => 'inactive',
        ])
            ->assertOk()
            ->assertJsonPath('data.role', 'merchant')
            ->assertJsonPath('data.account_status', 'inactive')
            ->assertJsonPath('data.merchant_profile.is_verified', false);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $student->id,
            'name' => 'student-session',
        ]);
        $this->assertDatabaseHas('merchant_profiles', [
            'user_id' => $student->id,
            'is_verified' => false,
        ]);
    }

    public function test_non_admin_cannot_access_user_management(): void
    {
        $student = $this->createUser('mahasiswa', 'student@example.test');

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/v1/admin/users')
            ->assertForbidden();
    }

    public function test_admin_cannot_change_own_access(): void
    {
        $admin = $this->createUser('admin', 'admin@example.test');

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/users/{$admin->id}", [
                'account_status' => 'inactive',
            ])
            ->assertUnprocessable();
    }

    public function test_roles_cannot_access_other_roles_private_api(): void
    {
        $merchant = $this->createUser('merchant', 'merchant@example.test');
        $student = $this->createUser('mahasiswa', 'student@example.test');

        $this->actingAs($merchant, 'sanctum')
            ->getJson('/api/v1/profile')
            ->assertForbidden();

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/v1/merchant/profile')
            ->assertForbidden();
    }

    public function test_inactive_accounts_are_blocked_from_login_and_private_api(): void
    {
        $inactive = $this->createUser('mahasiswa', 'inactive@example.test', 'inactive');

        $this->postJson('/api/auth/login', [
            'email' => $inactive->email,
            'password' => 'password123',
        ])
            ->assertForbidden()
            ->assertJsonPath('message', 'Akun ini sedang dinonaktifkan. Hubungi admin untuk bantuan.');

        $this->actingAs($inactive, 'sanctum')
            ->getJson('/api/v1/profile')
            ->assertForbidden();
    }

    public function test_public_registration_cannot_create_an_admin_account(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Admin Palsu',
            'email' => 'fake-admin@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'admin',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('role');
    }

    private function createUser(string $role, string $email, string $status = 'active'): User
    {
        return User::create([
            'name' => ucfirst($role) . ' Contoh',
            'email' => $email,
            'password' => 'password123',
            'role' => $role,
            'account_status' => $status,
        ]);
    }
}
