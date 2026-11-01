<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentPortfolio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PortfolioController extends Controller
{
    /**
     * GET /api/v1/portfolio
     * Daftar semua portofolio milik user
     */
    public function index(Request $request)
    {
        $portfolios = StudentPortfolio::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => true,
            'data'   => $portfolios,
        ]);
    }

    /**
     * POST /api/v1/portfolio
     * Upload portofolio baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'sometimes|nullable|string|max:1000',
            'file'        => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240', // max 10MB
        ]);

        $user = $request->user();

        // Batas maksimal 20 item
        $count = StudentPortfolio::where('user_id', $user->id)->count();
        if ($count >= 20) {
            return response()->json([
                'status'  => false,
                'message' => 'Maksimal 20 item portofolio diperbolehkan.',
            ], 422);
        }

        $file     = $request->file('file');
        $path     = $file->store('portfolios', 'public');
        $fileType = $file->getMimeType();
        $fileSize = $file->getSize(); // bytes

        $portfolio = StudentPortfolio::create([
            'user_id'     => $user->id,
            'title'       => $request->title,
            'description' => $request->description,
            'file_url'    => '/storage/' . $path,
            'file_type'   => $fileType,
            'file_size'   => $fileSize,
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Portofolio berhasil ditambahkan',
            'data'    => $portfolio,
        ], 201);
    }

    /**
     * GET /api/v1/portfolio/{id}
     * Detail satu item portofolio
     */
    public function show(Request $request, $id)
    {
        $portfolio = StudentPortfolio::where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'status' => true,
            'data'   => $portfolio,
        ]);
    }

    /**
     * PUT /api/v1/portfolio/{id}
     * Update judul/deskripsi portofolio (tanpa ganti file)
     */
    public function update(Request $request, $id)
    {
        $portfolio = StudentPortfolio::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string|max:1000',
        ]);

        $portfolio->update($request->only(['title', 'description']));

        return response()->json([
            'status'  => true,
            'message' => 'Portofolio berhasil diperbarui',
            'data'    => $portfolio,
        ]);
    }

    /**
     * DELETE /api/v1/portfolio/{id}
     * Hapus portofolio
     */
    public function destroy(Request $request, $id)
    {
        $portfolio = StudentPortfolio::where('user_id', $request->user()->id)
            ->findOrFail($id);

        // Hapus file fisik
        if ($portfolio->file_url) {
            $path = str_replace('/storage/', 'public/', $portfolio->file_url);
            Storage::delete($path);
        }

        $portfolio->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Portofolio berhasil dihapus',
        ]);
    }

    /**
     * GET /api/v1/portfolio/user/{userId}
     * Lihat portofolio user lain (semua aktor bisa lihat)
     */
    public function showPublic($userId)
    {
        $portfolios = StudentPortfolio::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => true,
            'data'   => $portfolios,
        ]);
    }
}
