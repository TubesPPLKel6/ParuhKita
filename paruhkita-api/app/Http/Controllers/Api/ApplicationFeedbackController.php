<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApplicationFeedbackReport;
use App\Models\JobApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ApplicationFeedbackController extends Controller
{
    public function show(Request $request, JobApplication $jobApplication)
    {
        $this->authorizeMerchant($request, $jobApplication);
        $report = $jobApplication->feedbackReport;

        return response()->json([
            'status' => true,
            'data' => [
                'report' => $report ? $this->present($report) : null,
            ],
        ]);
    }

    public function save(Request $request, JobApplication $jobApplication)
    {
        $this->authorizeMerchant($request, $jobApplication);

        $validated = $request->validate([
            'cv_score' => 'nullable|integer|min:1|max:5',
            'portfolio_score' => 'nullable|integer|min:1|max:5',
            'skills_score' => 'nullable|integer|min:1|max:5',
            'cv_note' => 'nullable|string|max:2000',
            'portfolio_note' => 'nullable|string|max:2000',
            'skills_note' => 'nullable|string|max:2000',
            'recommendations' => 'nullable|array',
            'recommendations.*' => 'string|max:500',
            'status' => ['required', Rule::in(['draft', 'final'])],
        ]);

        if ($validated['status'] === 'final') {
            foreach (['cv_score', 'portfolio_score', 'skills_score'] as $field) {
                if (empty($validated[$field])) {
                    throw ValidationException::withMessages([
                        $field => ['Semua skor wajib diisi sebelum dokumen masukan difinalisasi.'],
                    ]);
                }
            }
        }

        $report = DB::transaction(function () use ($validated, $jobApplication) {
            $existing = $jobApplication->feedbackReport;

            return ApplicationFeedbackReport::updateOrCreate(
                ['job_application_id' => $jobApplication->id],
                [
                    'cv_score' => $validated['cv_score'] ?? null,
                    'portfolio_score' => $validated['portfolio_score'] ?? null,
                    'skills_score' => $validated['skills_score'] ?? null,
                    'cv_note' => $validated['cv_note'] ?? null,
                    'portfolio_note' => $validated['portfolio_note'] ?? null,
                    'skills_note' => $validated['skills_note'] ?? null,
                    'recommendations' => $validated['recommendations'] ?? [],
                    'status' => $validated['status'],
                    'decided_at' => $validated['status'] === 'final'
                        ? ($existing?->decided_at ?? now())
                        : null,
                ]
            );
        });

        return response()->json([
            'status' => true,
            'message' => $validated['status'] === 'final'
                ? 'Dokumen masukan berhasil difinalisasi.'
                : 'Draf dokumen masukan berhasil disimpan.',
            'data' => ['report' => $this->present($report)],
        ]);
    }

    private function authorizeMerchant(Request $request, JobApplication $jobApplication): void
    {
        abort_unless($request->user()->role === 'merchant', 403, 'Akses hanya untuk merchant.');

        $profile = $request->user()->merchantProfile;
        abort_unless($profile !== null, 403, 'Profil usaha belum dibuat.');
        abort_unless(
            $jobApplication->jobPost()->where('merchant_profile_id', $profile->id)->exists(),
            404,
            'Lamaran tidak ditemukan.'
        );
    }

    private function present(ApplicationFeedbackReport $report): array
    {
        return [
            'id' => $report->id,
            'job_application_id' => $report->job_application_id,
            'cv_score' => $report->cv_score,
            'portfolio_score' => $report->portfolio_score,
            'skills_score' => $report->skills_score,
            'cv_note' => $report->cv_note,
            'portfolio_note' => $report->portfolio_note,
            'skills_note' => $report->skills_note,
            'recommendations' => $report->recommendations ?? [],
            'status' => $report->status,
            'decided_at' => $report->decided_at?->toDateString(),
        ];
    }
}
