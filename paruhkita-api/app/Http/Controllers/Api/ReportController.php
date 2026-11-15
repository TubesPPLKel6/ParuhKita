<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobPost;
use App\Models\MerchantProfile;
use App\Models\RecruitmentReport;
use Illuminate\Http\Request;
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
}
