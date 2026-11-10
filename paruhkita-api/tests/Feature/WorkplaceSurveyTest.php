<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class WorkplaceSurveyTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_submit_a_complete_workplace_survey(): void
    {
        $student = $this->createUser('mahasiswa', 'student-survey@test.local');
        $company = $this->createMerchant('Kopi Sela', true);
        $job = $company->jobPosts()->create([
            'title' => 'Barista Paruh Waktu',
            'category' => 'Makanan & Minuman',
            'schedule' => 'Senin-Jumat sore',
            'wage' => 'Rp25.000/jam',
            'quota' => '2 orang',
            'status' => 'active',
        ]);
        $ratings = [
            'wage' => [4, 4, 5, 4],
            'hours' => [4, 3, 4, 4],
            'safety' => [5, 4, 4, 5],
            'tasks' => [5, 4, 5, 4],
        ];

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/v1/student/workplace-surveys/companies')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.merchant_name', 'Kopi Sela');

        $this->postJson('/api/v1/student/workplace-surveys', [
            'merchant_profile_id' => $company->id,
            'position' => 'Barista',
            'department' => 'Operasional Kedai',
            'start_date' => '2026-06-01',
            'end_date' => '2026-08-31',
            'confirmed' => true,
            'ratings' => $ratings,
            'comments' => 'Pembayaran selalu tepat waktu.',
        ])
            ->assertCreated()
            ->assertJsonPath('data.merchant_profile.merchant_name', 'Kopi Sela')
            ->assertJsonPath('data.ratings.wage.0', 4);

        $this->assertDatabaseHas('workplace_surveys', [
            'user_id' => $student->id,
            'merchant_profile_id' => $company->id,
            'position' => 'Barista',
        ]);

        $this->getJson("/api/v1/job-posts/{$job->id}/merchant-reviews")
            ->assertOk()
            ->assertJsonPath('data.merchant.id', $company->id)
            ->assertJsonPath('data.survey_count', 1)
            ->assertJsonPath('data.averages.wage', 4.25)
            ->assertJsonPath('data.averages.overall', 4.25)
            ->assertJsonPath('data.reviews.0.position', 'Barista')
            ->assertJsonPath('data.reviews.0.question_scores.wage.0', 4)
            ->assertJsonMissingPath('data.reviews.0.user_id');

        $this->getJson('/api/v1/student/workplace-survey-reviews?merchant_ids[]=' . $company->id)
            ->assertOk()
            ->assertJsonPath('data.0.id', $company->id)
            ->assertJsonPath('data.0.survey_count', 1)
            ->assertJsonPath('data.0.averages.tasks', 4.5);

        $merchant = User::findOrFail($company->user_id);
        $this->actingAs($merchant, 'sanctum')
            ->getJson("/api/v1/merchants/{$company->id}/surveys")
            ->assertOk()
            ->assertJsonPath('data.survey_count', 1)
            ->assertJsonPath('data.averages.hours', 3.75)
            ->assertJsonPath('data.surveys.0.comments', 'Pembayaran selalu tepat waktu.')
            ->assertJsonPath('data.surveys.0.question_scores.tasks.2', 5);

        $otherCompany = $this->createMerchant('Toko Lain', true);
        $this->getJson("/api/v1/merchants/{$otherCompany->id}/surveys")
            ->assertNotFound();
    }

    public function test_survey_requires_all_scores_and_a_verified_company(): void
    {
        $student = $this->createUser('mahasiswa', 'student-invalid-survey@test.local');
        $company = $this->createMerchant('Belum Terverifikasi', false);

        $this->actingAs($student, 'sanctum')
            ->postJson('/api/v1/student/workplace-surveys', [
                'merchant_profile_id' => $company->id,
                'position' => 'Barista',
                'department' => 'Operasional',
                'start_date' => '2026-06-01',
                'end_date' => '2026-08-31',
                'confirmed' => true,
                'ratings' => ['wage' => [4, 4]],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['merchant_profile_id', 'ratings.wage', 'ratings.hours', 'ratings.safety', 'ratings.tasks']);
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

    private function createMerchant(string $name, bool $verified)
    {
        $merchant = $this->createUser('merchant', strtolower(str_replace(' ', '-', $name)) . '@test.local');

        return $merchant->merchantProfile()->create([
            'merchant_name' => $name,
            'category' => 'Makanan & Minuman',
            'is_verified' => $verified,
            'verification_status' => $verified ? 'approved' : 'pending',
        ]);
    }
}