<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StudentVerificationController extends Controller
{
    public function submit(Request $request)
    {
        abort_unless($request->user()->role === 'mahasiswa', 403);

        $profile = $request->user()->studentProfile;
        abort_unless($profile, 404, 'Profil mahasiswa tidak ditemukan.');
        abort_if($profile->verification_status === 'pending', 409, 'Dokumen KTM sedang ditinjau.');
        abort_if($profile->verification_status === 'approved', 409, 'Identitas mahasiswa sudah terverifikasi.');

        $validated = $request->validate([
            'nim' => 'required|string|max:50',
            'ktm_file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:3072',
        ]);

        $oldPath = $profile->ktm_file_path;
        $path = $request->file('ktm_file')->store("student-verification/{$request->user()->id}", 'local');
        abort_unless($path, 500, 'Gagal menyimpan dokumen KTM.');

        $profile->update([
            'nim' => $validated['nim'],
            'ktm_file_path' => $path,
            'is_verified' => false,
            'verification_status' => 'pending',
            'verification_submitted_at' => now(),
            'verified_at' => null,
            'verified_by_user_id' => null,
            'verification_note' => null,
        ]);

        if ($oldPath && $oldPath !== $path) {
            Storage::disk('local')->delete($oldPath);
        }

        return response()->json([
            'status' => true,
            'message' => 'Dokumen KTM berhasil diajukan untuk verifikasi.',
            'data' => $profile->fresh(),
        ], 201);
    }

    public function status(Request $request)
    {
        abort_unless($request->user()->role === 'mahasiswa', 403);
        abort_unless($request->user()->studentProfile, 404, 'Profil mahasiswa tidak ditemukan.');

        return response()->json(['status' => true, 'data' => $request->user()->studentProfile]);
    }
}
