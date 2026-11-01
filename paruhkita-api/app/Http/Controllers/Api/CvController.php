<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentCv;
use App\Models\CvBuilderSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CvController extends Controller
{
    /**
     * GET /api/v1/cv
     * Daftar semua CV milik user
     */
    public function index(Request $request)
    {
        $cvs = StudentCv::where('user_id', $request->user()->id)
            ->with('sections')
            ->orderBy('is_primary', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => true,
            'data'   => $cvs,
        ]);
    }

    /**
     * GET /api/v1/cv/{id}
     * Detail satu CV
     */
    public function show(Request $request, $id)
    {
        $cv = StudentCv::where('user_id', $request->user()->id)
            ->with('sections')
            ->findOrFail($id);

        return response()->json([
            'status' => true,
            'data'   => $cv,
        ]);
    }

    /**
     * POST /api/v1/cv/upload
     * Upload CV dalam format PDF
     */
    public function upload(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'file'  => 'required|file|mimes:pdf|max:10240', // max 10MB
        ]);

        $user = $request->user();

        // Cek batas max 5 CV
        $count = StudentCv::where('user_id', $user->id)->count();
        if ($count >= 5) {
            return response()->json([
                'status'  => false,
                'message' => 'Maksimal 5 versi CV diperbolehkan. Hapus CV lama untuk menambah baru.',
            ], 422);
        }

        $path   = $request->file('file')->store('cvs', 'public');
        $isPrimary = ($count === 0); // CV pertama otomatis jadi primary

        $cv = StudentCv::create([
            'user_id'    => $user->id,
            'title'      => $request->title,
            'type'       => 'upload',
            'file_url'   => '/storage/' . $path,
            'is_primary' => $isPrimary,
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'CV berhasil diunggah',
            'data'    => $cv,
        ], 201);
    }

    /**
     * POST /api/v1/cv/builder
     * Buat CV menggunakan form builder
     */
    public function storeBuilder(Request $request)
    {
        $request->validate([
            'title'              => 'required|string|max:255',
            'sections'           => 'sometimes|array',
            'sections.*.section_type' => 'required|string|max:100',
            'sections.*.title'   => 'required|string|max:255',
            'sections.*.content' => 'required|array',
            'sections.*.order'   => 'sometimes|integer',
        ]);

        $user = $request->user();

        $count = StudentCv::where('user_id', $user->id)->count();
        if ($count >= 5) {
            return response()->json([
                'status'  => false,
                'message' => 'Maksimal 5 versi CV diperbolehkan.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            $isPrimary = ($count === 0);

            $cv = StudentCv::create([
                'user_id'    => $user->id,
                'title'      => $request->title,
                'type'       => 'builder',
                'is_primary' => $isPrimary,
            ]);

            if ($request->has('sections')) {
                foreach ($request->sections as $i => $section) {
                    CvBuilderSection::create([
                        'cv_id'        => $cv->id,
                        'section_type' => $section['section_type'],
                        'title'        => $section['title'],
                        'content'      => $section['content'],
                        'order'        => $section['order'] ?? $i,
                    ]);
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status'  => false,
                'message' => 'Gagal membuat CV: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'status'  => true,
            'message' => 'CV berhasil dibuat',
            'data'    => $cv->load('sections'),
        ], 201);
    }

    /**
     * PUT /api/v1/cv/{id}
     * Update judul CV atau sections (builder)
     */
    public function update(Request $request, $id)
    {
        $cv = StudentCv::where('user_id', $request->user()->id)->findOrFail($id);

        $request->validate([
            'title'              => 'sometimes|string|max:255',
            'sections'           => 'sometimes|array',
            'sections.*.section_type' => 'required_with:sections|string|max:100',
            'sections.*.title'   => 'required_with:sections|string|max:255',
            'sections.*.content' => 'required_with:sections|array',
            'sections.*.order'   => 'sometimes|integer',
        ]);

        $cv->update($request->only(['title']));

        if ($request->has('sections') && $cv->type === 'builder') {
            $cv->sections()->delete();
            foreach ($request->sections as $i => $section) {
                CvBuilderSection::create([
                    'cv_id'        => $cv->id,
                    'section_type' => $section['section_type'],
                    'title'        => $section['title'],
                    'content'      => $section['content'],
                    'order'        => $section['order'] ?? $i,
                ]);
            }
        }

        return response()->json([
            'status'  => true,
            'message' => 'CV berhasil diperbarui',
            'data'    => $cv->fresh('sections'),
        ]);
    }

    /**
     * PATCH /api/v1/cv/{id}/set-primary
     * Jadikan CV tertentu sebagai CV utama
     */
    public function setPrimary(Request $request, $id)
    {
        $user = $request->user();

        // Reset semua CV jadi bukan primary
        StudentCv::where('user_id', $user->id)->update(['is_primary' => false]);

        // Set CV yang dipilih jadi primary
        $cv = StudentCv::where('user_id', $user->id)->findOrFail($id);
        $cv->update(['is_primary' => true]);

        return response()->json([
            'status'  => true,
            'message' => "CV \"{$cv->title}\" dijadikan CV utama",
            'data'    => $cv,
        ]);
    }

    /**
     * DELETE /api/v1/cv/{id}
     * Hapus CV
     */
    public function destroy(Request $request, $id)
    {
        $cv = StudentCv::where('user_id', $request->user()->id)->findOrFail($id);

        // Hapus file fisik jika ada
        if ($cv->file_url) {
            $path = str_replace('/storage/', 'public/', $cv->file_url);
            Storage::delete($path);
        }

        $cv->sections()->delete();
        $cv->delete();

        return response()->json([
            'status'  => true,
            'message' => 'CV berhasil dihapus',
        ]);
    }
}
