<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MerchantProfile;
use App\Models\StudentProfile;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminVerificationController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);

        $type = $request->query('type', 'all');
        $status = $request->query('status', 'all');
        $search = Str::lower(trim($request->query('search', '')));
        $perPage = min(max((int) $request->query('per_page', 10), 1), 50);
        $page = max((int) $request->query('page', 1), 1);

        $items = collect();
        if (in_array($type, ['all', 'student'], true)) {
            $students = StudentProfile::with('user:id,name,email')
                ->when($status !== 'all', fn ($query) => $query->where('verification_status', $status))
                ->when($search, fn ($query) => $query->where(function ($query) use ($search) {
                    $query->where('nim', 'like', "%{$search}%")
                        ->orWhere('university', 'like', "%{$search}%")
                        ->orWhere('major', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($user) => $user->whereRaw('LOWER(name) like ?', ["%{$search}%"])->orWhereRaw('LOWER(email) like ?', ["%{$search}%"]));
                }))
                ->whereNotNull('ktm_file_path')
                ->get()
                ->map(fn ($profile) => $this->studentItem($profile));
            $items = $items->concat($students);
        }

        if (in_array($type, ['all', 'merchant'], true)) {
            $merchants = MerchantProfile::with(['user:id,name,email', 'verificationDocuments:id,merchant_profile_id,document_type,original_name'])
                ->when($status !== 'all', fn ($query) => $query->where('verification_status', $status))
                ->when($search, fn ($query) => $query->where(function ($query) use ($search) {
                    $query->whereRaw('LOWER(merchant_name) like ?', ["%{$search}%"])
                        ->orWhereRaw('LOWER(category) like ?', ["%{$search}%"])
                        ->orWhereHas('user', fn ($user) => $user->whereRaw('LOWER(name) like ?', ["%{$search}%"])->orWhereRaw('LOWER(email) like ?', ["%{$search}%"]));
                }))
                ->where('verification_status', '!=', 'not_submitted')
                ->get()
                ->map(fn ($profile) => $this->merchantItem($profile));
            $items = $items->concat($merchants);
        }

        $items = $items->sortByDesc('submitted_at')->values();
        $total = $items->count();
        $data = $items->slice(($page - 1) * $perPage, $perPage)->values();
        $paginator = new LengthAwarePaginator($data, $total, $perPage, $page, ['path' => $request->url(), 'query' => $request->query()]);

        return response()->json([
            'success' => true,
            'meta' => [
                'stats' => [
                    'total_pending' => StudentProfile::where('verification_status', 'pending')->count() + MerchantProfile::where('verification_status', 'pending')->count(),
                    'verified_students' => StudentProfile::where('verification_status', 'approved')->count(),
                    'verified_merchants' => MerchantProfile::where('verification_status', 'approved')->count(),
                    'total_rejected_or_revision' => StudentProfile::whereIn('verification_status', ['rejected', 'revision_required'])->count() + MerchantProfile::whereIn('verification_status', ['rejected', 'revision_required'])->count(),
                ],
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'total' => $paginator->total(),
                    'per_page' => $paginator->perPage(),
                    'last_page' => $paginator->lastPage(),
                ],
            ],
            'data' => $paginator->items(),
        ]);
    }

    public function streamDocument(Request $request, string $type, int $profileId, int $documentId = 0)
    {
        abort_unless($request->user()->role === 'admin', 403);
        if ($type === 'student') {
            $profile = StudentProfile::findOrFail($profileId);
            $path = $profile->ktm_file_path;
            $name = 'KTM-' . $profile->nim;
        } else {
            $document = \App\Models\MerchantVerificationDocument::where('merchant_profile_id', $profileId)->findOrFail($documentId);
            $path = $document->file_path;
            $name = $document->original_name;
        }

        $file = Storage::disk('local')->path($path);
        abort_unless(is_file($file), 404, 'Dokumen tidak ditemukan.');
        return response()->file($file, ['Content-Disposition' => 'inline; filename="' . addslashes($name) . '"']);
    }

    public function approve(Request $request, string $type, int $id)
    {
        abort_unless($request->user()->role === 'admin', 403);
        $profile = $this->profile($type, $id);
        abort_unless($profile->verification_status === 'pending', 409, 'Permohonan ini tidak sedang menunggu verifikasi.');
        $profile->update(['is_verified' => true, 'verification_status' => 'approved', 'verification_note' => null, 'verified_at' => now(), 'verified_by_user_id' => $request->user()->id]);
        return response()->json(['status' => true, 'message' => 'Dokumen berhasil diverifikasi.', 'data' => $profile->fresh()]);
    }

    public function requestRevision(Request $request, string $type, int $id)
    {
        abort_unless($request->user()->role === 'admin', 403);
        $validated = $request->validate(['notes' => 'required|string|max:1000']);
        $profile = $this->profile($type, $id);
        abort_unless($profile->verification_status === 'pending', 409, 'Permohonan ini tidak sedang menunggu verifikasi.');
        $profile->update(['is_verified' => false, 'verification_status' => 'revision_required', 'verification_note' => $validated['notes'], 'verified_at' => null, 'verified_by_user_id' => $request->user()->id]);
        return response()->json(['status' => true, 'message' => 'Permintaan revisi berhasil dikirim.', 'data' => $profile->fresh()]);
    }

    public function reject(Request $request, string $type, int $id)
    {
        abort_unless($request->user()->role === 'admin', 403);
        $validated = $request->validate(['reason' => 'required|string|max:1000']);
        $profile = $this->profile($type, $id);
        abort_unless($profile->verification_status === 'pending', 409, 'Permohonan ini tidak sedang menunggu verifikasi.');
        $profile->update(['is_verified' => false, 'verification_status' => 'rejected', 'verification_note' => $validated['reason'], 'verified_at' => null, 'verified_by_user_id' => $request->user()->id]);
        return response()->json(['status' => true, 'message' => 'Permohonan verifikasi ditolak.', 'data' => $profile->fresh()]);
    }

    public function batchApprove(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);
        $validated = $request->validate(['items' => 'required|array|min:1', 'items.*.type' => 'required|in:student,merchant', 'items.*.id' => 'required|integer']);
        $count = 0;
        foreach ($validated['items'] as $item) {
            $profile = $this->profile($item['type'], $item['id']);
            if ($profile->verification_status !== 'pending') continue;
            $profile->update(['is_verified' => true, 'verification_status' => 'approved', 'verification_note' => null, 'verified_at' => now(), 'verified_by_user_id' => $request->user()->id]);
            $count++;
        }
        return response()->json(['success' => true, 'message' => "{$count} permohonan verifikasi berhasil disetujui secara massal.", 'approved_count' => $count]);
    }

    private function profile(string $type, int $id)
    {
        abort_unless(in_array($type, ['student', 'merchant'], true), 404);
        return $type === 'student' ? StudentProfile::findOrFail($id) : MerchantProfile::findOrFail($id);
    }

    private function studentItem(StudentProfile $profile): array
    {
        return ['id' => 'std_' . $profile->id, 'entity_type' => 'student', 'profile_id' => $profile->id, 'user_id' => $profile->user_id, 'name' => $profile->user?->name, 'email' => $profile->user?->email, 'institution_or_category' => $profile->university, 'major' => $profile->major, 'identifier_number' => $profile->nim, 'submitted_at' => $profile->verification_submitted_at, 'status' => $profile->verification_status, 'verification_note' => $profile->verification_note, 'documents' => [['id' => 0, 'type' => 'ktm', 'name' => basename($profile->ktm_file_path), 'preview_url' => "/api/v1/admin/verifications/student/{$profile->id}/document"]]];
    }

    private function merchantItem(MerchantProfile $profile): array
    {
        return ['id' => 'mrc_' . $profile->id, 'entity_type' => 'merchant', 'profile_id' => $profile->id, 'user_id' => $profile->user_id, 'name' => $profile->merchant_name, 'email' => $profile->user?->email, 'institution_or_category' => $profile->category, 'major' => null, 'identifier_number' => $profile->category, 'submitted_at' => $profile->verification_submitted_at, 'status' => $profile->verification_status, 'verification_note' => $profile->verification_note, 'documents' => $profile->verificationDocuments->map(fn ($document) => ['id' => $document->id, 'type' => $document->document_type, 'name' => $document->original_name, 'preview_url' => "/api/v1/admin/verifications/merchant/{$profile->id}/documents/{$document->id}"])->values()->all()];
    }
}
