<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use App\Models\StudentSkill;
use App\Models\StudentAvailability;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    // =============================================
    //  PROFILE
    // =============================================

    /**
     * GET /api/v1/profile
     * Ambil profil lengkap user yang sedang login
     */
    public function show(Request $request)
    {
        $user = $request->user()->load([
            'studentProfile',
            'studentSkills',
            'studentAvailabilities',
        ]);

        return response()->json([
            'status' => true,
            'data'   => $this->formatProfile($user),
        ]);
    }

    /**
     * GET /api/v1/profile/{userId}
     * Lihat profil user lain (semua aktor bisa lihat)
     */
    public function showPublic($userId)
    {
        $user = \App\Models\User::with([
            'studentProfile',
            'studentSkills',
            'studentAvailabilities',
        ])->findOrFail($userId);

        return response()->json([
            'status' => true,
            'data'   => $this->formatProfile($user),
        ]);
    }

    /**
     * PUT /api/v1/profile
     * Update data profil
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'name'            => 'sometimes|string|max:255',
            'phone'           => 'sometimes|nullable|string|max:20',
            'bio'             => 'sometimes|nullable|string|max:1000',
            'university'      => 'sometimes|nullable|string|max:255',
            'faculty'         => 'sometimes|nullable|string|max:255',
            'major'           => 'sometimes|nullable|string|max:255',
            'degree_level'    => 'sometimes|nullable|string|max:50',
            'entry_year'      => 'sometimes|nullable|integer|min:1990|max:2099',
            'graduation_year' => 'sometimes|nullable|integer|min:1990|max:2099',
            'is_currently_studying' => 'sometimes|boolean',
            'gpa'             => 'sometimes|nullable|numeric|min:0|max:4',
            'linkedin_url'    => 'sometimes|nullable|url|max:500',
            'github_url'      => 'sometimes|nullable|url|max:500',
            'instagram_url'   => 'sometimes|nullable|url|max:500',
            'experiences'     => 'sometimes|nullable|array',
            'portfolio_projects' => 'sometimes|nullable|array',
        ]);

        $user = $request->user();

        // Update nama di tabel users
        if (isset($validated['name'])) {
            $user->update(['name' => $validated['name']]);
        }

        // Update/buat student_profile
        $profileData = array_diff_key($validated, array_flip(['name']));
        $profile = StudentProfile::updateOrCreate(
            ['user_id' => $user->id],
            $profileData
        );

        return response()->json([
            'status'  => true,
            'message' => 'Profil berhasil diperbarui',
            'data'    => $this->formatProfile($user->fresh(['studentProfile', 'studentSkills', 'studentAvailabilities'])),
        ]);
    }

    /**
     * POST /api/v1/profile/photo
     * Upload foto profil
     */
    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048', // max 2MB
        ]);

        $user = $request->user();

        // Hapus foto lama jika ada
        $profile = $user->studentProfile;
        if ($profile && $profile->photo_url) {
            $oldPath = str_replace('/storage/', 'public/', $profile->photo_url);
            Storage::delete($oldPath);
        }

        // Simpan foto baru
        $path     = $request->file('photo')->store('photos', 'public');
        $photoUrl = '/storage/' . $path;

        StudentProfile::updateOrCreate(
            ['user_id' => $user->id],
            ['photo_url' => $photoUrl]
        );

        return response()->json([
            'status'    => true,
            'message'   => 'Foto profil berhasil diperbarui',
            'photo_url' => $photoUrl,
        ]);
    }

    // =============================================
    //  SKILLS
    // =============================================

    /**
     * POST /api/v1/profile/skills
     * Tambah skill baru (free-text tag)
     */
    public function addSkill(Request $request)
    {
        $request->validate([
            'skill_name' => 'required|string|max:100',
        ]);

        $user = $request->user();

        // Cek duplikat
        $exists = StudentSkill::where('user_id', $user->id)
            ->whereRaw('LOWER(skill_name) = ?', [strtolower($request->skill_name)])
            ->exists();

        if ($exists) {
            return response()->json([
                'status'  => false,
                'message' => 'Skill sudah ada',
            ], 422);
        }

        $skill = StudentSkill::create([
            'user_id'    => $user->id,
            'skill_name' => $request->skill_name,
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Skill berhasil ditambahkan',
            'data'    => $skill,
        ], 201);
    }

    /**
     * DELETE /api/v1/profile/skills/{id}
     * Hapus skill
     */
    public function deleteSkill(Request $request, $id)
    {
        $skill = StudentSkill::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $skill->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Skill berhasil dihapus',
        ]);
    }

    // =============================================
    //  AVAILABILITY
    // =============================================

    /**
     * PUT /api/v1/profile/availability
     * Set/ganti ketersediaan waktu (replace semua)
     */
    public function updateAvailability(Request $request)
    {
        $request->validate([
            'availabilities'             => 'required|array|min:1',
            'availabilities.*.day_of_week' => [
                'required',
                Rule::in(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']),
            ],
            'availabilities.*.start_time'  => 'required|date_format:H:i',
            'availabilities.*.end_time'    => 'required|date_format:H:i|after:availabilities.*.start_time',
            'availabilities.*.hours_per_day' => 'sometimes|nullable|numeric|min:0|max:24',
        ]);

        $user = $request->user();

        // Hapus semua availability lama, ganti dengan yang baru
        StudentAvailability::where('user_id', $user->id)->delete();

        $records = [];
        foreach ($request->availabilities as $avail) {
            $records[] = StudentAvailability::create([
                'user_id'      => $user->id,
                'day_of_week'  => $avail['day_of_week'],
                'start_time'   => $avail['start_time'],
                'end_time'     => $avail['end_time'],
                'hours_per_day' => $avail['hours_per_day'] ?? null,
            ]);
        }

        return response()->json([
            'status'  => true,
            'message' => 'Ketersediaan waktu berhasil diperbarui',
            'data'    => $records,
        ]);
    }

    // =============================================
    //  HELPER
    // =============================================

    private function formatProfile($user): array
    {
        $profile = $user->studentProfile;
        $photoBase64 = null;
        if ($profile && $profile->photo_url) {
            $relativePath = preg_replace('#^.*?/storage/#', '', $profile->photo_url);
            if (Storage::disk('public')->exists($relativePath)) {
                $mime = Storage::disk('public')->mimeType($relativePath) ?? 'image/jpeg';
                $content = Storage::disk('public')->get($relativePath);
                $photoBase64 = 'data:' . $mime . ';base64,' . base64_encode($content);
            }
        }

        return [
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role,
            'profile' => $profile ? [
                'photo_url'       => $profile->photo_url,
                'photo_base64'    => $photoBase64,
                'phone'           => $profile->phone,
                'bio'             => $profile->bio,
                'university'      => $profile->university,
                'faculty'         => $profile->faculty,
                'major'           => $profile->major,
                'degree_level'    => $profile->degree_level ?? 'S1',
                'entry_year'      => $profile->entry_year,
                'graduation_year' => $profile->graduation_year,
                'is_currently_studying' => (bool)($profile->is_currently_studying ?? true),
                'gpa'             => $profile->gpa,
                'linkedin_url'    => $profile->linkedin_url,
                'github_url'      => $profile->github_url,
                'instagram_url'   => $profile->instagram_url,
                'experiences'     => $profile->experiences ?? [],
                'portfolio_projects' => $profile->portfolio_projects ?? [],
            ] : null,
            'skills'       => $user->studentSkills->map(fn($s) => ['id' => $s->id, 'name' => $s->skill_name])->values(),
            'availabilities' => $user->studentAvailabilities->map(fn($a) => [
                'id'           => $a->id,
                'day_of_week'  => $a->day_of_week,
                'start_time'   => $a->start_time,
                'end_time'     => $a->end_time,
                'hours_per_day' => $a->hours_per_day,
            ])->values(),
        ];
    }
}
