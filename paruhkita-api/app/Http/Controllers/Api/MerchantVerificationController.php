<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MerchantProfile;
use App\Models\MerchantVerificationDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MerchantVerificationController extends Controller
{
    private const DOCUMENT_TYPES = [
        'ktp',
        'nib',
        'business_license',
        'store_photo',
        'npwp',
    ];

    public function submit(Request $request)
    {
        abort_unless($request->user()->role === 'merchant', 403);

        $profile = $request->user()->merchantProfile;
        abort_unless($profile, 404, 'Profil merchant tidak ditemukan.');
        abort_if($profile->is_verified, 409, 'Usaha ini sudah terverifikasi.');
        abort_if($profile->verification_status === 'pending', 409, 'Dokumen sedang ditinjau.');

        $rules = [];
        foreach (self::DOCUMENT_TYPES as $type) {
            $rules[$type] = 'required|file|mimes:pdf,jpg,jpeg,png|max:5120';
        }
        $validated = $request->validate($rules);

        $storedPaths = [];
        $oldPaths = [];
        try {
            DB::transaction(function () use ($profile, $validated, &$storedPaths, &$oldPaths) {
                foreach (self::DOCUMENT_TYPES as $type) {
                    $file = $validated[$type];
                    $path = $file->store("merchant-verification/{$profile->user_id}", 'local');
                    if (!$path) {
                        throw new \RuntimeException("Gagal menyimpan dokumen {$type}.");
                    }
                    $storedPaths[] = $path;

                    $document = $profile->verificationDocuments()->firstOrNew([
                        'document_type' => $type,
                    ]);
                    $oldPath = $document->file_path;
                    $document->fill([
                        'file_path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                    ]);
                    $document->save();

                    if ($oldPath && $oldPath !== $path) {
                        $oldPaths[] = $oldPath;
                    }
                }

                $profile->update([
                    'is_verified' => false,
                    'verification_status' => 'pending',
                    'verification_submitted_at' => now(),
                    'verification_note' => null,
                    'verified_at' => null,
                    'verified_by_user_id' => null,
                ]);
            });
        } catch (\Throwable $exception) {
            Storage::disk('local')->delete($storedPaths);
            throw $exception;
        }
        Storage::disk('local')->delete($oldPaths);

        return response()->json([
            'status' => true,
            'message' => 'Dokumen berhasil dikirim dan sedang menunggu verifikasi.',
            'data' => $profile->fresh(),
        ], 201);
    }

    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);

        $profiles = MerchantProfile::with([
            'user:id,name,email',
            'verificationDocuments:id,merchant_profile_id,document_type,original_name',
        ])
            ->where('verification_status', 'pending')
            ->orderBy('verification_submitted_at')
            ->get();

        return response()->json(['status' => true, 'data' => $profiles]);
    }

    public function downloadDocument(Request $request, MerchantVerificationDocument $document)
    {
        abort_unless($request->user()->role === 'admin', 403);

        $path = Storage::disk('local')->path($document->file_path);
        abort_unless(is_file($path), 404, 'Dokumen tidak ditemukan.');

        return response()->download($path, $document->original_name);
    }

    public function approve(Request $request, MerchantProfile $merchantProfile)
    {
        abort_unless($request->user()->role === 'admin', 403);
        abort_unless($merchantProfile->verification_status === 'pending', 409, 'Permohonan ini tidak sedang menunggu verifikasi.');

        $merchantProfile->update([
            'is_verified' => true,
            'verification_status' => 'approved',
            'verification_note' => null,
            'verified_at' => now(),
            'verified_by_user_id' => $request->user()->id,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Merchant berhasil diverifikasi.',
            'data' => $merchantProfile->fresh(),
        ]);
    }

    public function reject(Request $request, MerchantProfile $merchantProfile)
    {
        abort_unless($request->user()->role === 'admin', 403);
        abort_unless($merchantProfile->verification_status === 'pending', 409, 'Permohonan ini tidak sedang menunggu verifikasi.');

        $validated = $request->validate([
            'note' => 'required|string|max:1000',
        ]);

        $merchantProfile->update([
            'is_verified' => false,
            'verification_status' => 'rejected',
            'verification_note' => $validated['note'],
            'verified_at' => null,
            'verified_by_user_id' => $request->user()->id,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Permohonan verifikasi ditolak.',
            'data' => $merchantProfile->fresh(),
        ]);
    }
}
