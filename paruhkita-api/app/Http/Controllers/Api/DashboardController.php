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
