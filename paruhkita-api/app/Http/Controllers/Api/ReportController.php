<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobPost;
use App\Models\MerchantNotification;
use App\Models\MerchantProfile;
use App\Models\RecruitmentReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    public function formOptions(Request $request)
    {
        abort_unless($request->user()->role === 'mahasiswa', 403, 'Akses hanya untuk mahasiswa.');

        $merchants = MerchantProfile::where('is_verified', true)
            ->select('id', 'merchant_name')
            ->orderBy('merchant_name')
            ->get();

        $jobs = JobPost::with('merchantProfile:id,merchant_name')
            ->select('id', 'merchant_profile_id', 'title')
            ->latest()
            ->get();

        return response()->json([
            'status' => true,
            'data' => [
                'merchants' => $merchants,
                'jobs' => $jobs,
            ],
        ]);
    }

    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'mahasiswa', 403, 'Akses hanya untuk mahasiswa.');

        $reports = RecruitmentReport::where('reporter_id', $request->user()->id)
            ->with([
                'jobPost:id,title',
                'merchantProfile:id,merchant_name',
            ])
            ->latest()
            ->get();

        return response()->json([
            'status' => true,
            'data' => $reports,
        ]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->role === 'mahasiswa', 403, 'Akses hanya untuk mahasiswa.');

        $validated = $request->validate([
            'stage' => ['required', Rule::in(['recruitment', 'work'])],
            'category' => 'required|string|max:100',
            'title' => 'required|string|min:5|max:255',
            'description' => 'required|string|min:20|max:4000',
            'job_post_id' => 'nullable|exists:job_posts,id',
            'merchant_profile_id' => 'nullable|exists:merchant_profiles,id',
            'evidence' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $evidencePath = null;
        $evidenceName = null;

        if ($request->hasFile('evidence')) {
            $file = $request->file('evidence');
            $evidencePath = $file->store('report-evidences', 'local');
            $evidenceName = $file->getClientOriginalName();
        }

        $report = RecruitmentReport::create([
            'reporter_id' => $request->user()->id,
            'job_post_id' => $validated['job_post_id'] ?? null,
            'merchant_profile_id' => $validated['merchant_profile_id'] ?? null,
            'stage' => $validated['stage'],
            'category' => $validated['category'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'evidence_path' => $evidencePath,
            'evidence_name' => $evidenceName,
            'status' => 'submitted',
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Laporan masalah berhasil dikirim dan akan segera ditinjau oleh tim platform.',
            'data' => $report->load(['jobPost:id,title', 'merchantProfile:id,merchant_name']),
        ], 201);
    }

    public function update(Request $request, RecruitmentReport $recruitmentReport)
    {
        abort_unless($request->user()->role === 'mahasiswa', 403, 'Akses hanya untuk mahasiswa.');
        abort_unless($recruitmentReport->reporter_id === $request->user()->id, 404, 'Laporan tidak ditemukan.');
        abort_unless($recruitmentReport->status === 'submitted', 422, 'Laporan yang sedang atau sudah ditindaklanjuti admin tidak dapat diubah.');

        $validated = $request->validate([
            'stage' => ['required', Rule::in(['recruitment', 'work'])],
            'category' => 'required|string|max:100',
            'title' => 'required|string|min:5|max:255',
            'description' => 'required|string|min:20|max:4000',
            'job_post_id' => 'nullable|exists:job_posts,id',
            'merchant_profile_id' => 'nullable|exists:merchant_profiles,id',
            'evidence' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        if ($request->hasFile('evidence')) {
            if ($recruitmentReport->evidence_path) {
                Storage::disk('local')->delete($recruitmentReport->evidence_path);
            }
            $file = $request->file('evidence');
            $recruitmentReport->evidence_path = $file->store('report-evidences', 'local');
            $recruitmentReport->evidence_name = $file->getClientOriginalName();
        }

        $recruitmentReport->fill([
            'stage' => $validated['stage'],
            'category' => $validated['category'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'job_post_id' => $validated['job_post_id'] ?? null,
            'merchant_profile_id' => $validated['merchant_profile_id'] ?? null,
        ])->save();

        return response()->json([
            'status' => true,
            'message' => 'Laporan pengaduan berhasil diperbarui.',
            'data' => $recruitmentReport->fresh()->load(['jobPost:id,title', 'merchantProfile:id,merchant_name']),
        ]);
    }

    public function destroy(Request $request, RecruitmentReport $recruitmentReport)
    {
        abort_unless($request->user()->role === 'mahasiswa', 403, 'Akses hanya untuk mahasiswa.');
        abort_unless($recruitmentReport->reporter_id === $request->user()->id, 404, 'Laporan tidak ditemukan.');
        abort_unless($recruitmentReport->status === 'submitted', 422, 'Laporan yang sedang atau sudah ditindaklanjuti admin tidak dapat dihapus.');

        if ($recruitmentReport->evidence_path) {
            Storage::disk('local')->delete($recruitmentReport->evidence_path);
        }

        $recruitmentReport->delete();

        return response()->json([
            'status' => true,
            'message' => 'Laporan pengaduan berhasil dihapus.',
        ]);
    }

    public function adminIndex(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Akses hanya untuk admin.');

        $reports = RecruitmentReport::with([
            'reporter:id,name,email',
            'jobPost:id,title',
            'merchantProfile:id,merchant_name',
        ])
            ->latest()
            ->get();

        return response()->json([
            'status' => true,
            'data' => $reports,
        ]);
    }

    public function adminFollowUp(Request $request, RecruitmentReport $recruitmentReport)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Akses hanya untuk admin.');

        $validated = $request->validate([
            'status' => ['required', Rule::in(['submitted', 'investigating', 'resolved', 'dismissed'])],
            'admin_note' => 'required|string|min:5|max:2000',
            'notify_merchant' => 'nullable|boolean',
            'merchant_message' => 'nullable|string|max:1000',
        ]);

        $recruitmentReport->update([
            'status' => $validated['status'],
            'admin_note' => $validated['admin_note'],
        ]);

        $merchantProfileId = $recruitmentReport->merchant_profile_id
            ?: $recruitmentReport->jobPost?->merchant_profile_id;

        if (!empty($validated['notify_merchant']) && $merchantProfileId) {
            MerchantNotification::create([
                'merchant_profile_id' => $merchantProfileId,
                'recruitment_report_id' => $recruitmentReport->id,
                'title' => 'Tindak Lanjut Laporan Pelamar: ' . $recruitmentReport->title,
                'message' => trim($validated['merchant_message'] ?? '') ?: $validated['admin_note'],
            ]);
        }

        return response()->json([
            'status' => true,
            'message' => 'Tindak lanjut laporan berhasil disimpan.',
            'data' => $recruitmentReport->fresh()->load([
                'reporter:id,name,email',
                'jobPost:id,title',
                'merchantProfile:id,merchant_name',
            ]),
        ]);
    }

    public function merchantNotifications(Request $request)
    {
        abort_unless($request->user()->role === 'merchant', 403, 'Akses hanya untuk merchant.');
        $profile = $request->user()->merchantProfile;
        abort_unless($profile, 404, 'Profil merchant tidak ditemukan.');

        $notifications = MerchantNotification::where('merchant_profile_id', $profile->id)
            ->latest()
            ->get();

        return response()->json([
            'status' => true,
            'data' => $notifications,
        ]);
    }

    public function markNotificationRead(Request $request, MerchantNotification $merchantNotification)
    {
        abort_unless($request->user()->role === 'merchant', 403, 'Akses hanya untuk merchant.');
        $profile = $request->user()->merchantProfile;
        abort_unless($profile && $merchantNotification->merchant_profile_id === $profile->id, 404);

        $merchantNotification->update(['is_read' => true]);

        return response()->json([
            'status' => true,
            'message' => 'Notifikasi ditandai sudah dibaca.',
        ]);
    }
}
