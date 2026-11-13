<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\JobCategory;
use App\Models\JobPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class JobController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'mahasiswa', 403, 'Akses hanya untuk mahasiswa.');

        $jobs = JobPost::query()
            ->where('status', 'active')
            ->where(fn ($query) => $query->whereNull('application_deadline')->orWhereDate('application_deadline', '>=', now()->toDateString()))
            ->whereHas('merchantProfile', fn ($query) => $query->where('is_verified', true))
            ->with('merchantProfile:id,merchant_name,address,logo_path')
            ->withCount('applications')
            ->withExists([
                'applications as is_applied' => fn ($query) => $query->where('user_id', $request->user()->id),
            ])
            ->latest()
            ->get();

        return response()->json(['status' => true, 'data' => $jobs]);
    }

    public function show(Request $request, JobPost $jobPost)
    {
        abort_unless($request->user()->role === 'mahasiswa', 403, 'Akses hanya untuk mahasiswa.');
        abort_unless(
            $jobPost->status === 'active'
                && $jobPost->merchantProfile()->where('is_verified', true)->exists()
                && (!$jobPost->application_deadline || $jobPost->application_deadline->toDateString() >= now()->toDateString()),
            404,
            'Lowongan tidak tersedia.'
        );

        $jobPost->load('merchantProfile:id,merchant_name,address,logo_path')
            ->loadCount('applications')
            ->loadExists(['applications as is_applied' => fn ($query) => $query->where('user_id', $request->user()->id)]);

        return response()->json(['status' => true, 'data' => $jobPost]);
    }

    public function merchantIndex(Request $request)
    {
        $profile = $this->verifiedMerchantProfile($request);
        $jobs = JobPost::where('merchant_profile_id', $profile->id)
            ->withCount('applications')
            ->with([
                'applications.student:id,name',
                'applications.student.studentProfile:id,user_id,university,major',
            ])
            ->latest()
            ->get();

        return response()->json(['status' => true, 'data' => $jobs]);
    }

    public function store(Request $request)
    {
        $profile = $this->verifiedMerchantProfile($request);
        $validated = $this->validatedJobData($request);

        $job = $profile->jobPosts()->create($validated);

        return response()->json([
            'status' => true,
            'message' => 'Lowongan berhasil dipublikasikan.',
            'data' => $job->loadCount('applications'),
        ], 201);
    }

    public function update(Request $request, JobPost $jobPost)
    {
        $profile = $this->verifiedMerchantProfile($request);
        abort_unless($jobPost->merchant_profile_id === $profile->id, 404);
        $validated = $this->validatedJobData($request);
        $jobPost->update($validated);

        return response()->json([
            'status' => true,
            'message' => 'Lowongan berhasil diperbarui.',
            'data' => $jobPost->fresh()->loadCount('applications'),
        ]);
    }

    public function destroy(Request $request, JobPost $jobPost)
    {
        $profile = $this->verifiedMerchantProfile($request);
        abort_unless($jobPost->merchant_profile_id === $profile->id, 404);
        $jobPost->delete();

        return response()->json(['status' => true, 'message' => 'Lowongan berhasil dihapus.']);
    }

    public function apply(Request $request, JobPost $jobPost)
    {
        abort_unless($request->user()->role === 'mahasiswa', 403, 'Akses hanya untuk mahasiswa.');
        abort_unless(
            $jobPost->status === 'active' && $jobPost->merchantProfile()->where('is_verified', true)->exists(),
            404,
            'Lowongan tidak tersedia.'
        );

        if ($jobPost->application_deadline && $jobPost->application_deadline->toDateString() < now()->toDateString()) {
            throw ValidationException::withMessages(['job' => 'Batas akhir lowongan ini sudah lewat.']);
        }

        if ($jobPost->applications()->where('user_id', $request->user()->id)->exists()) {
            throw ValidationException::withMessages(['job' => 'Kamu sudah melamar lowongan ini.']);
        }

        $validated = $request->validate([
            'motivation' => 'required|string|min:20|max:3000',
            'cv' => 'required|file|mimes:pdf|max:2048',
            'student_id' => 'required|file|mimes:pdf,jpg,jpeg,png|max:2048',
            'portfolio' => 'nullable|file|mimes:pdf|max:5120',
        ]);

        $storedFiles = [];
        try {
            foreach (['cv', 'student_id', 'portfolio'] as $type) {
                if ($request->hasFile($type)) {
                    $file = $request->file($type);
                    $storedFiles[$type] = [
                        'path' => $file->store('application-documents', 'local'),
                        'name' => $file->getClientOriginalName(),
                        'mime' => $file->getMimeType(),
                        'size' => $file->getSize(),
                    ];
                }
            }

            $application = DB::transaction(function () use ($jobPost, $request, $validated, $storedFiles) {
                $application = $jobPost->applications()->create([
                    'user_id' => $request->user()->id,
                    'status' => 'pending',
                    'motivation' => $validated['motivation'],
                ]);

                foreach ($storedFiles as $type => $file) {
                    $application->documents()->create([
                        'document_type' => $type,
                        'original_name' => $file['name'],
                        'file_path' => $file['path'],
                        'mime_type' => $file['mime'],
                        'file_size' => $file['size'],
                    ]);
                }

                $application->statusHistories()->create([
                    'status' => 'submitted',
                    'note' => 'Formulir dan dokumen berhasil dikirim.',
                ]);

                $application->statusHistories()->create([
                    'status' => 'received',
                    'note' => 'Lamaran tercatat dan diteruskan ke ' . $jobPost->merchantProfile->merchant_name . '.',
                ]);

                $application->statusHistories()->create([
                    'status' => 'pending',
                    'note' => 'Masuk antrean peninjauan merchant.',
                ]);

                return $application;
            });
        } catch (\Throwable $error) {
            foreach ($storedFiles as $file) {
                Storage::disk('local')->delete($file['path']);
            }
            throw $error;
        }

        return response()->json([
            'status' => true,
            'message' => 'Lamaran berhasil dikirim.',
            'data' => $application,
        ], 201);
    }

    public function studentApplications(Request $request)
    {
        abort_unless($request->user()->role === 'mahasiswa', 403, 'Akses hanya untuk mahasiswa.');
        $applications = JobApplication::where('user_id', $request->user()->id)
            ->with(['jobPost.merchantProfile:id,merchant_name,address', 'documents', 'statusHistories', 'student:id,name,email', 'student.studentProfile:user_id,university,major'])
            ->latest()
            ->get();

        return response()->json(['status' => true, 'data' => $applications]);
    }

    public function downloadApplicationDocument(Request $request, JobApplication $jobApplication, $documentId)
    {
        abort_unless($jobApplication->user_id === $request->user()->id, 404);
        $document = $jobApplication->documents()->findOrFail($documentId);
        abort_unless(Storage::disk('local')->exists($document->file_path), 404);

        return Storage::disk('local')->download($document->file_path, $document->original_name);
    }

    public function updateApplication(Request $request, JobApplication $jobApplication)
    {
        $profile = $this->verifiedMerchantProfile($request);
        abort_unless($jobApplication->jobPost()->where('merchant_profile_id', $profile->id)->exists(), 404);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'reviewing', 'interview', 'trial', 'accepted', 'rejected'])],
            'merchant_note' => 'nullable|string|max:2000|required_if:status,rejected',
        ]);

        $previousStatus = $jobApplication->status;
        $jobApplication->update($validated);
        if ($previousStatus !== $jobApplication->status) {
            $jobApplication->statusHistories()->create([
                'status' => $jobApplication->status,
                'note' => $jobApplication->merchant_note,
            ]);
        }

        return response()->json([
            'status' => true,
            'message' => 'Status lamaran berhasil diperbarui.',
            'data' => $jobApplication->fresh(),
        ]);
    }

    public function merchantJobApplicants(Request $request, JobPost $jobPost)
    {
        $profile = $this->verifiedMerchantProfile($request);
        abort_unless($jobPost->merchant_profile_id === $profile->id, 404, 'Lowongan tidak ditemukan.');

        $query = $jobPost->applications()
            ->with([
                'student:id,name,email',
                'student.studentProfile',
                'documents:id,job_application_id,document_type,original_name,mime_type,file_size',
                'statusHistories',
            ])
            ->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        return response()->json([
            'status' => true,
            'data' => [
                'job' => $jobPost->only(['id', 'title', 'category', 'subcategory', 'schedule', 'wage', 'quota', 'status', 'application_deadline']),
                'applicants' => $query->get(),
            ],
        ]);
    }

    public function merchantApplicationDetail(Request $request, JobApplication $jobApplication)
    {
        $profile = $this->verifiedMerchantProfile($request);
        abort_unless($jobApplication->jobPost()->where('merchant_profile_id', $profile->id)->exists(), 404, 'Lamaran tidak ditemukan.');

        $jobApplication->load([
            'jobPost:id,merchant_profile_id,title,category,subcategory,schedule,wage,quota,application_deadline',
            'student:id,name,email,phone',
            'student.studentProfile',
            'student.studentSkills',
            'student.studentAvailabilities',
            'student.studentCvs',
            'student.studentPortfolios',
            'documents',
            'statusHistories',
        ]);

        return response()->json([
            'status' => true,
            'data' => $jobApplication,
        ]);
    }

    public function merchantDownloadDocument(Request $request, JobApplication $jobApplication, $documentId)
    {
        $profile = $this->verifiedMerchantProfile($request);
        abort_unless($jobApplication->jobPost()->where('merchant_profile_id', $profile->id)->exists(), 404, 'Lamaran tidak ditemukan.');

        $document = $jobApplication->documents()->findOrFail($documentId);
        abort_unless(Storage::disk('local')->exists($document->file_path), 404, 'File dokumen tidak ditemukan.');

        return Storage::disk('local')->download($document->file_path, $document->original_name);
    }

    private function verifiedMerchantProfile(Request $request)
    {
        abort_unless($request->user()->role === 'merchant', 403, 'Akses hanya untuk merchant.');
        $profile = $request->user()->merchantProfile;
        abort_unless($profile && $profile->is_verified, 403, 'Usaha harus terverifikasi untuk mengelola lowongan.');

        return $profile;
    }

    private function validatedJobData(Request $request): array
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => [
                'required',
                'string',
                Rule::exists('job_categories', 'name')->where('status', 'active'),
            ],
            'subcategory' => 'nullable|string|max:255',
            'schedule' => 'required|string|max:255',
            'wage' => 'required|string|max:100',
            'quota' => 'required|string|max:100',
            'description' => 'nullable|string|max:5000',
            'responsibilities' => 'nullable|string|max:5000',
            'qualifications' => 'nullable|string|max:5000',
            'application_deadline' => 'nullable|date|after_or_equal:today',
        ]);
        $this->validateSubcategory($validated['category'], $validated['subcategory'] ?? null);

        return $validated;
    }

    private function validateSubcategory(string $categoryName, ?string $subcategoryName): void
    {
        if ($subcategoryName === null || $subcategoryName === '') {
            return;
        }

        $category = JobCategory::where('name', $categoryName)->first();
        if (!$category || !$category->subcategories()->where('name', $subcategoryName)->exists()) {
            throw ValidationException::withMessages([
                'subcategory' => 'Subkategori tidak sesuai dengan kategori yang dipilih.',
            ]);
        }
    }
}
