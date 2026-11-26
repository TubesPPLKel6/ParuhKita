<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MerchantProfile;
use App\Models\QuickReplyTemplate;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class QuickReplyTemplateController extends Controller
{
    public function index(Request $request)
    {
        $merchantProfile = $this->resolveMerchantProfile($request);

        $validated = $request->validate([
            'q' => 'nullable|string|max:150',
            'category' => ['nullable', 'string', Rule::in(QuickReplyTemplate::CATEGORIES)],
            'status' => 'nullable|in:active,inactive,aktif,nonaktif',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $query = QuickReplyTemplate::query()
            ->where('merchant_profile_id', $merchantProfile->id);

        if (!empty($validated['q'])) {
            $search = mb_strtolower(trim($validated['q']));
            $query->where(function ($builder) use ($search) {
                $builder->whereRaw('LOWER(title) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(body) LIKE ?', ["%{$search}%"]);
            });
        }

        if (!empty($validated['category'])) {
            $query->where('category', $validated['category']);
        }

        if (!empty($validated['status'])) {
            $isActive = in_array($validated['status'], ['active', 'aktif'], true);
            $query->where('is_active', $isActive);
        }

        $perPage = (int) ($validated['per_page'] ?? 10);
        $paginator = $query->latest('updated_at')->latest('id')->paginate($perPage);

        return response()->json([
            'status' => true,
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem() ?? 0,
                'to' => $paginator->lastItem() ?? 0,
            ],
        ]);
    }

    public function active(Request $request)
    {
        $merchantProfile = $this->resolveMerchantProfile($request);

        $validated = $request->validate([
            'q' => 'nullable|string|max:150',
        ]);

        $query = QuickReplyTemplate::query()
            ->where('merchant_profile_id', $merchantProfile->id)
            ->where('is_active', true);

        if (!empty($validated['q'])) {
            $search = mb_strtolower(trim($validated['q']));
            $query->where(function ($builder) use ($search) {
                $builder->whereRaw('LOWER(title) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(body) LIKE ?', ["%{$search}%"]);
            });
        }

        $templates = $query->latest('updated_at')->latest('id')->get();

        return response()->json([
            'status' => true,
            'data' => $templates,
        ]);
    }

    public function store(Request $request)
    {
        $merchantProfile = $this->resolveMerchantProfile($request);
        $validated = $this->validatePayload($request);

        $template = $merchantProfile->quickReplyTemplates()->create($validated);

        return response()->json([
            'status' => true,
            'message' => 'Templat berhasil disimpan.',
            'data' => $template,
        ], 201);
    }

    public function update(Request $request, QuickReplyTemplate $quickReplyTemplate)
    {
        $merchantProfile = $this->resolveMerchantProfile($request);
        $this->authorizeOwnership($merchantProfile, $quickReplyTemplate);

        $validated = $this->validatePayload($request);
        $quickReplyTemplate->update($validated);

        return response()->json([
            'status' => true,
            'message' => 'Templat berhasil disimpan.',
            'data' => $quickReplyTemplate->fresh(),
        ]);
    }

    public function destroy(Request $request, QuickReplyTemplate $quickReplyTemplate)
    {
        $merchantProfile = $this->resolveMerchantProfile($request);
        $this->authorizeOwnership($merchantProfile, $quickReplyTemplate);

        $quickReplyTemplate->delete();

        return response()->json([
            'status' => true,
            'message' => 'Templat berhasil dihapus.',
        ]);
    }

    private function resolveMerchantProfile(Request $request): MerchantProfile
    {
        $user = $request->user();
        abort_unless($user && $user->role === 'merchant', 403, 'Akses ditolak untuk peran akun ini.');

        $profile = $user->merchantProfile;
        abort_unless($profile !== null, 404, 'Profil merchant tidak ditemukan.');

        return $profile;
    }

    private function authorizeOwnership(MerchantProfile $merchantProfile, QuickReplyTemplate $template): void
    {
        abort_unless(
            $template->merchant_profile_id === $merchantProfile->id,
            403,
            'Anda tidak memiliki akses untuk mengelola templat ini.'
        );
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate(
            [
                'title' => 'required|string|max:150',
                'category' => ['required', 'string', Rule::in(QuickReplyTemplate::CATEGORIES)],
                'body' => 'required|string|max:2000',
                'is_active' => 'required|boolean',
            ],
            [
                'title.required' => 'Judul templat wajib diisi.',
                'title.max' => 'Judul templat maksimal 150 karakter.',
                'category.required' => 'Kategori wajib dipilih.',
                'category.in' => 'Kategori yang dipilih tidak valid.',
                'body.required' => 'Isi pesan wajib diisi.',
                'body.max' => 'Isi pesan maksimal 2.000 karakter.',
                'is_active.required' => 'Status templat wajib dipilih.',
                'is_active.boolean' => 'Format status templat tidak valid.',
            ]
        );
    }
}
