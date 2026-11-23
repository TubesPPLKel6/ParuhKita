<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\StudentCv;
use App\Models\StudentPortfolio;
use Illuminate\Http\Request;
use Throwable;

class DashboardController extends Controller
{
    /**
     * GET /api/v1/dashboard/summary
     * Ringkasan aktivitas mahasiswa untuk halaman dashboard
     */
    public function summary(Request $request)
    {
        try {
            $user = $request->user();

            // ----- Data yang sudah bisa diambil dari TUB-3 -----
            $totalCv        = StudentCv::where('user_id', $user->id)->count();
            $totalPortfolio = StudentPortfolio::where('user_id', $user->id)->count();
            $primaryCv      = StudentCv::where('user_id', $user->id)
                                ->where('is_primary', true)
                                ->first(['id', 'title', 'type']);

            $profileComplete = $this->calcProfileCompletion($user);

            $applications = JobApplication::where('user_id', $user->id);
            $applicationCounts = [
                'total' => (clone $applications)->count(),
                'pending' => (clone $applications)->whereIn('status', ['pending', 'reviewing'])->count(),
                'accepted' => (clone $applications)->where('status', 'accepted')->count(),
                'rejected' => (clone $applications)->where('status', 'rejected')->count(),
            ];
            $recommendedJobs = JobPost::where('status', 'active')
                ->whereHas('merchantProfile', fn ($query) => $query->where('is_verified', true))
                ->with('merchantProfile:id,merchant_name,address')
                ->latest()
                ->limit(3)
                ->get();

            $dummySchedules = [];
            $dummyBadges    = [];   // TUB-8: lencana
            $dummyRating    = null; // TUB-7: rating dari merchant

            return response()->json([
                'status' => true,
                'data'   => [
                    'profile_completion' => $profileComplete,
                    'cv' => [
                        'total'      => $totalCv,
                        'primary_cv' => $primaryCv,
                    ],
                    'portfolio' => [
                        'total' => $totalPortfolio,
                    ],
                    'applications'         => $applicationCounts,
                    'upcoming_schedules'   => $dummySchedules,
                    'recommended_jobs'     => $recommendedJobs,
                    'badges'               => $dummyBadges,
                    'rating'               => $dummyRating,
                ],
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'status'  => false,
                'message' => 'Terjadi kesalahan server: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/v1/admin/dashboard
     * Ringkasan operasional untuk dashboard admin.
     */
    public function adminSummary(Request $request)
    {
        $period = $request->query('period', 'month');
        $start = match ($period) {
            'week' => now()->subWeek(),
            '30-days' => now()->subDays(30),
            default => now()->startOfMonth(),
        };

        $totalUsers = \App\Models\User::whereIn('role', ['mahasiswa', 'merchant'])->count();
        $newUsers = \App\Models\User::whereIn('role', ['mahasiswa', 'merchant'])
            ->where('created_at', '>=', $start)
            ->count();
        $activeJobs = JobPost::where('status', 'active')->count();
        $newJobs = JobPost::where('created_at', '>=', $start)->count();
        $applications = JobApplication::where('created_at', '>=', $start);
        $applicationTotal = (clone $applications)->count();
        $acceptedApplications = (clone $applications)->where('status', 'accepted')->count();
        $acceptanceRate = $applicationTotal > 0
            ? round(($acceptedApplications / $applicationTotal) * 100, 1)
            : 0;

        $recentUsers = \App\Models\User::whereIn('role', ['mahasiswa', 'merchant'])
            ->latest()
            ->limit(4)
            ->get(['id', 'name', 'role', 'created_at'])
            ->map(fn ($user) => [
                'id' => 'user-' . $user->id,
                'at' => $user->created_at,
                'actor' => $user->name,
                'actor_type' => $user->role === 'merchant' ? 'Merchant' : 'Mahasiswa',
                'action' => 'Membuat akun baru',
                'detail' => 'Pengguna baru terdaftar',
            ]);

        $recentJobs = JobPost::with('merchantProfile:id,merchant_name')
            ->latest()
            ->limit(4)
            ->get(['id', 'merchant_profile_id', 'title', 'created_at'])
            ->map(fn ($job) => [
                'id' => 'job-' . $job->id,
                'at' => $job->created_at,
                'actor' => $job->merchantProfile?->merchant_name ?? 'Merchant',
                'actor_type' => 'Merchant',
                'action' => 'Membuat lowongan baru',
                'detail' => $job->title,
            ]);

        $recentApplications = JobApplication::with(['student:id,name', 'jobPost:id,title'])
            ->latest()
            ->limit(4)
            ->get(['id', 'user_id', 'job_post_id', 'created_at'])
            ->map(fn ($application) => [
                'id' => 'application-' . $application->id,
                'at' => $application->created_at,
                'actor' => $application->student?->name ?? 'Mahasiswa',
                'actor_type' => 'Mahasiswa',
                'action' => 'Mengirim lamaran',
                'detail' => $application->jobPost?->title ?? 'Lowongan',
            ]);

        $activities = $recentUsers->concat($recentJobs)->concat($recentApplications)
            ->sortByDesc('at')
            ->take(6)
            ->values();

        $monthlyTrend = collect(range(9, 0))->map(function ($monthsAgo) {
            $date = now()->subMonths($monthsAgo);
            return [
                'label' => $date->locale('id')->translatedFormat('M'),
                'users' => \App\Models\User::whereIn('role', ['mahasiswa', 'merchant'])
                    ->whereBetween('created_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()])->count(),
                'jobs' => JobPost::whereBetween('created_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()])->count(),
                'applications' => JobApplication::whereBetween('created_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()])->count(),
            ];
        });

        return response()->json([
            'status' => true,
            'data' => [
                'period' => $period,
                'stats' => [
                    'total_users' => $totalUsers,
                    'new_users' => $newUsers,
                    'active_jobs' => $activeJobs,
                    'new_jobs' => $newJobs,
                    'applications' => $applicationTotal,
                    'acceptance_rate' => $acceptanceRate,
                ],
                'application_status' => [
                    'accepted' => (clone $applications)->where('status', 'accepted')->count(),
                    'pending' => (clone $applications)->whereIn('status', ['pending', 'reviewing'])->count(),
                    'in_process' => (clone $applications)->whereIn('status', ['interview', 'trial'])->count(),
                    'rejected' => (clone $applications)->where('status', 'rejected')->count(),
                ],
                'trend' => $monthlyTrend,
                'activities' => $activities,
                'alerts' => [
                    'pending_merchants' => \App\Models\MerchantProfile::where('verification_status', 'pending')->count(),
                    'pending_complaints' => 0,
                    'expired_jobs' => JobPost::whereNotNull('application_deadline')
                        ->whereDate('application_deadline', '<', now())
                        ->where('status', 'active')
                        ->count(),
                ],
            ],
        ]);
    }

    /**
     * Hitung persentase kelengkapan profil (0-100)
     */
    private function calcProfileCompletion($user): int
    {
        $profile = $user->studentProfile;
        if (!$profile) {
            return 0;
        }

        $fields = [
            'photo_url', 'bio', 'phone', 'university',
            'faculty', 'major', 'graduation_year',
        ];

        $filled = 0;
        foreach ($fields as $field) {
            if (!empty($profile->$field)) {
                $filled++;
            }
        }

        $hasSkills       = $user->studentSkills()->exists()        ? 1 : 0;
        $hasAvailability = $user->studentAvailabilities()->exists() ? 1 : 0;

        $total  = count($fields) + 2; // +2 untuk skills & availability
        $filled = $filled + $hasSkills + $hasAvailability;

        return (int) round(($filled / $total) * 100);
    }
}
