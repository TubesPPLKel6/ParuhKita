<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MerchantProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class MerchantProfileController extends Controller
{
    public function show(Request $request)
    {
        abort_unless($request->user()->role === 'merchant', 403);

        $profile = $request->user()->merchantProfile()
            ->with(['user:id,name,email,phone', 'facilities'])
            ->firstOrFail();

        return response()->json(['status' => true, 'data' => $profile]);
    }

    public function showPublic(int $merchantProfileId)
    {
        $profile = MerchantProfile::query()
            ->with([
                'user:id,email',
                'facilities:id,merchant_profile_id,name,category,description',
            ])
            ->findOrFail($merchantProfileId);

        return response()->json([
            'status' => true,
            'data' => $profile->only([
                'id',
                'merchant_name',
                'category',
                'description',
                'phone',
                'address',
                'logo_path',
                'banner_path',
                'facilities',
            ]) + ['email' => $profile->user?->email],
        ]);
    }

    public function update(Request $request)
    {
        abort_unless($request->user()->role === 'merchant', 403);

        $user = $request->user();
        if (is_string($request->input('facilities'))) {
            $facilities = json_decode($request->input('facilities'), true);
            $request->merge(['facilities' => is_array($facilities) ? $facilities : null]);
        }

        $validated = $request->validate([
            'merchant_name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
            'phone' => 'required|string|max:30',
            'address' => 'required|string|max:2000',
            'logo' => 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'banner' => 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'facilities' => 'present|array|max:30',
            'facilities.*.name' => 'required|string|max:255',
            'facilities.*.category' => [
                'required',
                Rule::in(['dining', 'transportation', 'worship', 'other']),
            ],
            'facilities.*.description' => 'nullable|string|max:1000',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ]);

        $newAssetPaths = [];
        $oldAssetPaths = [];
        try {
            $profile = DB::transaction(function () use ($user, $validated, &$newAssetPaths, &$oldAssetPaths) {
                $user->update([
                    'name' => $validated['merchant_name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'] ?? null,
                ]);

                $profile = $user->merchantProfile()->firstOrNew();
                $isNewProfile = !$profile->exists;
                $profile->fill([
                    'merchant_name' => $validated['merchant_name'],
                    'category' => $validated['category'],
                    'description' => $validated['description'] ?? null,
                    'phone' => $validated['phone'] ?? null,
                    'address' => $validated['address'] ?? null,
                ]);
                if ($isNewProfile) {
                    $profile->is_verified = false;
                    $profile->verification_status = 'not_submitted';
                }

                foreach (['logo', 'banner'] as $asset) {
                    if ($requestFile = ($validated[$asset] ?? null)) {
                        $path = $requestFile->store("merchant-assets/{$user->id}", 'public');
                        if (!$path) {
                            throw new \RuntimeException("Gagal menyimpan {$asset} usaha.");
                        }
                        $newAssetPaths[] = $path;
                        $pathColumn = "{$asset}_path";
                        if ($profile->{$pathColumn}) {
                            $oldAssetPaths[] = $profile->{$pathColumn};
                        }
                        $profile->{$pathColumn} = $path;
                    }
                }

                $profile->save();
                $profile->facilities()->delete();
                foreach ($validated['facilities'] as $facility) {
                    $profile->facilities()->create($facility);
                }

                return $profile->fresh();
            });
        } catch (\Throwable $exception) {
            Storage::disk('public')->delete($newAssetPaths);
            throw $exception;
        }

        Storage::disk('public')->delete($oldAssetPaths);

        return response()->json([
            'status' => true,
            'message' => 'Profil usaha berhasil disimpan.',
            'data' => $profile->load(['user:id,name,email,phone', 'facilities']),
        ]);
    }

    public function destroy(Request $request)
    {
        abort_unless($request->user()->role === 'merchant', 403);

        $profile = $request->user()->merchantProfile()
            ->with('verificationDocuments')
            ->firstOrFail();
        $documentPaths = $profile->verificationDocuments->pluck('file_path')->all();
        $assetPaths = array_filter([$profile->logo_path, $profile->banner_path]);

        $profile->delete();
        Storage::disk('local')->delete($documentPaths);
        Storage::disk('public')->delete($assetPaths);

        return response()->json([
            'status' => true,
            'message' => 'Profil usaha berhasil dihapus. Akun login tetap aktif.',
        ]);
    }
}
