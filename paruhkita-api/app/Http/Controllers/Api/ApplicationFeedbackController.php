<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApplicationFeedbackCategory;
use App\Models\ApplicationFeedbackReport;
use App\Models\JobApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ApplicationFeedbackController extends Controller
{
    private const DEFAULT_CATEGORIES = [
        'Dokumen CV',
        'Portofolio',
        'Tingkat Keterampilan (Skills)',
    ];

    public function show(Request $request, JobApplication $jobApplication)
    {
        $this->authorizeMerchant($request, $jobApplication);
        $report = $this->ensureReport($jobApplication);

        return response()->json([
            'status' => true,
            'data' => [
                'application' => $this->presentApplication($jobApplication),
                'report' => $this->present($report),
                'sidebar' => $this->sidebarCounts($request),
            ],
        ]);
    }

    public function save(Request $request, JobApplication $jobApplication)
    {
        $this->authorizeMerchant($request, $jobApplication);

        $validated = $request->validate([
            'categories' => 'required|array|min:1',
            'categories.*.id' => 'required|integer',
            'categories.*.score' => 'nullable|integer|min:1|max:5',
            'categories.*.note' => 'nullable|string|max:2000',
            'recommendations' => 'nullable|array',
            'recommendations.*' => 'string|max:500',
            'status' => ['required', Rule::in(['draft', 'final'])],
        ]);

        $report = $this->ensureReport($jobApplication);
        $ownedIds = $report->categories()->pluck('id')->all();

        foreach ($validated['categories'] as $entry) {
            if (!in_array((int) $entry['id'], $ownedIds, true)) {
                throw ValidationException::withMessages([
                    'categories' => ['Kategori penilaian tidak valid untuk lamaran ini.'],
                ]);
            }
        }

        if ($validated['status'] === 'final') {
            $incomplete = collect($validated['categories'])->contains(
                fn ($entry) => empty($entry['score']) || empty(trim((string) ($entry['note'] ?? '')))
            );

            if ($incomplete) {
                throw ValidationException::withMessages([
                    'categories' => ['Semua kategori wajib memiliki skor dan catatan sebelum feedback dikirim.'],
                ]);
            }

            $recommendations = collect($validated['recommendations'] ?? [])
                ->map(fn ($item) => trim((string) $item))
                ->filter()
                ->values();

            if ($recommendations->isEmpty()) {
                throw ValidationException::withMessages([
                    'recommendations' => ['Rekomendasi perbaikan wajib diisi sebelum feedback dikirim.'],
                ]);
            }

            $validated['recommendations'] = $recommendations->all();
        }

        DB::transaction(function () use ($report, $validated) {
            foreach ($validated['categories'] as $entry) {
                ApplicationFeedbackCategory::where('id', $entry['id'])->update([
                    'score' => $entry['score'] ?? null,
                    'note' => $entry['note'] ?? null,
                ]);
            }

            $report->refresh()->load('categories');
            $legacy = $this->legacyScores($report->categories);

            $report->update([
                'cv_score' => $legacy['cv_score'],
                'portfolio_score' => $legacy['portfolio_score'],
                'skills_score' => $legacy['skills_score'],
                'cv_note' => $legacy['cv_note'],
                'portfolio_note' => $legacy['portfolio_note'],
                'skills_note' => $legacy['skills_note'],
                'recommendations' => $validated['recommendations'] ?? $report->recommendations,
                'status' => $validated['status'],
                'decided_at' => $validated['status'] === 'final'
                    ? ($report->decided_at ?? now())
                    : null,
            ]);
        });

        $report->refresh()->load('categories');

        return response()->json([
            'status' => true,
            'message' => $validated['status'] === 'final'
                ? 'Feedback berhasil disimpan dan dikirim.'
                : 'Draf feedback berhasil disimpan.',
            'data' => [
                'report' => $this->present($report),
                'application' => $this->presentApplication($jobApplication),
            ],
        ]);
    }

    public function storeCategory(Request $request, JobApplication $jobApplication)
    {
        $this->authorizeMerchant($request, $jobApplication);

        $validated = $request->validate([
            'name' => 'required|string|max:80',
            'score' => 'nullable|integer|min:1|max:5',
            'note' => 'nullable|string|max:2000',
        ]);

        $report = $this->ensureReport($jobApplication);

        $category = $report->categories()->create([
            'name' => trim($validated['name']),
            'score' => $validated['score'] ?? null,
            'note' => $validated['note'] ?? null,
            'position' => (int) $report->categories()->max('position') + 1,
            'is_default' => false,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Kategori berhasil ditambahkan.',
            'data' => [
                'category' => $this->presentCategory($category),
                'report' => $this->present($report->refresh()->load('categories')),
            ],
        ], 201);
    }

    public function updateCategory(Request $request, JobApplication $jobApplication, ApplicationFeedbackCategory $category)
    {
        $this->authorizeMerchant($request, $jobApplication);
        abort_unless($category->job_application_id === $jobApplication->id, 404, 'Kategori tidak ditemukan.');

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:80',
            'score' => 'nullable|integer|min:1|max:5',
            'note' => 'nullable|string|max:2000',
        ]);

        $category->update([
            'name' => isset($validated['name']) ? trim($validated['name']) : $category->name,
            'score' => array_key_exists('score', $validated) ? $validated['score'] : $category->score,
            'note' => array_key_exists('note', $validated) ? $validated['note'] : $category->note,
        ]);

        $report = $jobApplication->feedbackReport;

        return response()->json([
            'status' => true,
            'message' => 'Perubahan kategori berhasil disimpan.',
            'data' => [
                'category' => $this->presentCategory($category->refresh()),
                'report' => $report ? $this->present($report->refresh()->load('categories')) : null,
            ],
        ]);
    }

    public function destroyCategory(Request $request, JobApplication $jobApplication, ApplicationFeedbackCategory $category)
    {
        $this->authorizeMerchant($request, $jobApplication);
        abort_unless($category->job_application_id === $jobApplication->id, 404, 'Kategori tidak ditemukan.');

        $category->delete();
        $report = $jobApplication->feedbackReport;

        return response()->json([
            'status' => true,
            'message' => 'Kategori berhasil dihapus.',
            'data' => [
                'report' => $report ? $this->present($report->refresh()->load('categories')) : null,
            ],
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

        $request->attributes->set('merchant_profile', $profile);
    }

    private function ensureReport(JobApplication $jobApplication): ApplicationFeedbackReport
    {
        $report = $jobApplication->feedbackReport;

        if (!$report) {
            $report = ApplicationFeedbackReport::create([
                'job_application_id' => $jobApplication->id,
                'recommendations' => [],
                'status' => 'draft',
            ]);
        }

        if ($report->categories()->count() === 0) {
            foreach (self::DEFAULT_CATEGORIES as $index => $name) {
                $report->categories()->create([
                    'name' => $name,
                    'position' => $index,
                    'is_default' => true,
                ]);
            }
        }

        return $report;
    }

    private function legacyScores($categories): array
    {
        $byName = $categories->keyBy('name');
        $cv = $byName->get('Dokumen CV');
        $portfolio = $byName->get('Portofolio');
        $skills = $byName->get('Tingkat Keterampilan (Skills)');

        return [
            'cv_score' => $cv?->score,
            'portfolio_score' => $portfolio?->score,
            'skills_score' => $skills?->score,
            'cv_note' => $cv?->note,
            'portfolio_note' => $portfolio?->note,
            'skills_note' => $skills?->note,
        ];
    }

    private function present(ApplicationFeedbackReport $report): array
    {
        $categories = $report->categories()->get();
        $legacy = $this->legacyScores($categories);

        return [
            'id' => $report->id,
            'job_application_id' => $report->job_application_id,
            'categories' => $categories->map(fn ($category) => $this->presentCategory($category))->values(),
            'recommendations' => $report->recommendations ?? [],
            'status' => $report->status,
            'decided_at' => $report->decided_at?->toDateString(),
            'decided_at_label' => $report->decided_at
                ? $this->formatDate($report->decided_at)
                : null,
        ] + $legacy;
    }

    private function presentCategory(ApplicationFeedbackCategory $category): array
    {
        return [
            'id' => $category->id,
            'name' => $category->name,
            'score' => $category->score,
            'note' => $category->note,
            'position' => $category->position,
            'is_default' => (bool) $category->is_default,
        ];
    }

    private function presentApplication(JobApplication $jobApplication): array
    {
        $jobApplication->loadMissing(['student:id,name', 'jobPost.merchantProfile:id,merchant_name,address']);

        $student = $jobApplication->student;
        $job = $jobApplication->jobPost;
        $merchant = $job?->merchantProfile;

        return [
            'id' => $jobApplication->id,
            'status' => $jobApplication->status,
            'status_label' => $jobApplication->status === 'rejected' ? 'Belum Diterima / Ditolak' : ucfirst($jobApplication->status),
            'status_note' => $jobApplication->status === 'rejected'
                ? 'Seleksi telah selesai. Feedback ini untuk kesiapan rekrutmen berikutnya.'
                : 'Seleksi telah selesai. Feedback ini untuk pengembangan kandidat.',
            'candidate' => [
                'id' => $student?->id,
                'name' => $student?->name,
                'initials' => $this->initials($student?->name),
            ],
            'job' => [
                'id' => $job?->id,
                'title' => $job?->title,
            ],
            'merchant' => [
                'name' => $merchant?->merchant_name,
                'address' => $merchant?->address,
            ],
        ];
    }

    private function sidebarCounts(Request $request): array
    {
        $profile = $request->attributes->get('merchant_profile');

        return [
            'jobs' => $profile ? $profile->jobPosts()->count() : 0,
            'candidates' => $profile
                ? JobApplication::whereHas('jobPost', fn ($query) => $query->where('merchant_profile_id', $profile->id))->count()
                : 0,
            'messages' => 0,
        ];
    }

    private function initials(?string $name): string
    {
        if (!$name) {
            return 'NA';
        }

        return collect(explode(' ', trim($name)))
            ->filter()
            ->take(2)
            ->map(fn ($part) => mb_strtoupper(mb_substr($part, 0, 1)))
            ->implode('');
    }

    private function formatDate($date): string
    {
        $months = [
            1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr', 5 => 'Mei', 6 => 'Jun',
            7 => 'Jul', 8 => 'Agu', 9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des',
        ];

        return $date->day . ' ' . ($months[$date->month] ?? '') . ' ' . $date->year;
    }
}
