<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MerchantProfile;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
            'role' => 'nullable|in:mahasiswa,merchant,admin',
            'status' => 'nullable|in:active,inactive',
            'verification' => 'nullable|in:approved,pending,revision_required,rejected,not_submitted',
            'institution' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $query = User::query()->with(['studentProfile', 'merchantProfile']);
        if (!empty($validated['search'])) {
            $term = $validated['search'];
            $query->where(fn ($users) => $users
                ->where('name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhereHas('studentProfile', fn ($profile) => $profile
                    ->where('nim', 'like', "%{$term}%")
                    ->orWhere('university', 'like', "%{$term}%"))
                ->orWhereHas('merchantProfile', fn ($profile) => $profile
                    ->where('merchant_name', 'like', "%{$term}%")
                    ->orWhere('category', 'like', "%{$term}%")));
        }
        if (!empty($validated['role'])) {
            $query->where('role', $validated['role']);
        }
        if (!empty($validated['status'])) {
            $query->where('account_status', $validated['status']);
        }
        if (!empty($validated['institution'])) {
            $institution = $validated['institution'];
            $query->where(fn ($users) => $users
                ->whereHas('studentProfile', fn ($profile) => $profile->where('university', $institution))
                ->orWhereHas('merchantProfile', fn ($profile) => $profile->where('category', $institution)));
        }
        if (!empty($validated['verification'])) {
            $verification = $validated['verification'];
            $query->whereIn('role', ['mahasiswa', 'merchant'])->where(function ($users) use ($verification) {
                foreach (['studentProfile' => 'mahasiswa', 'merchantProfile' => 'merchant'] as $relation => $role) {
                    $users->orWhere(function ($matchingRole) use ($relation, $role, $verification) {
                        $matchingRole->where('role', $role);
                        if ($verification === 'not_submitted') {
                            $matchingRole->where(fn ($profile) => $profile
                                ->whereDoesntHave($relation)
                                ->orWhereHas($relation, fn ($details) => $details->where('verification_status', 'not_submitted')));
                        } elseif ($verification === 'approved') {
                            $matchingRole->whereHas($relation, fn ($details) => $details
                                ->where('verification_status', 'approved')
                                ->where('is_verified', true));
                        } else {
                            $matchingRole->whereHas($relation, fn ($details) => $details->where('verification_status', $verification));
                        }
                    });
                }
            });
        }

        $users = $query->orderByDesc('created_at')
            ->paginate($validated['per_page'] ?? 15);
        $stats = User::query()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN role = 'mahasiswa' THEN 1 ELSE 0 END) as mahasiswa")
            ->selectRaw("SUM(CASE WHEN role = 'merchant' THEN 1 ELSE 0 END) as merchant")
            ->selectRaw("SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin")
            ->selectRaw("SUM(CASE WHEN account_status = 'inactive' THEN 1 ELSE 0 END) as inactive")
            ->first();
        $institutions = StudentProfile::query()->whereNotNull('university')->distinct()->pluck('university')
            ->merge(MerchantProfile::query()->whereNotNull('category')->distinct()->pluck('category'))
            ->filter()
            ->unique()
            ->sort()
            ->values();

        return response()->json([
            'status' => true,
            'data' => $users->getCollection()->map(fn (User $user) => $this->formatUser($user))->values(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'stats' => [
                    'total' => (int) $stats->total,
                    'mahasiswa' => (int) $stats->mahasiswa,
                    'merchant' => (int) $stats->merchant,
                    'admin' => (int) $stats->admin,
                    'inactive' => (int) $stats->inactive,
                ],
                'institutions' => $institutions,
            ],
        ]);
    }

    public function show(User $user)
    {
        $user->load(['studentProfile', 'merchantProfile']);

        return response()->json(['status' => true, 'data' => $this->formatUser($user)]);
    }

    public function update(Request $request, User $user)
    {
        abort_if($request->user()->id === $user->id, 422, 'Admin tidak dapat mengubah status atau peran akunnya sendiri.');

        $validated = $request->validate([
            'role' => 'sometimes|required|in:mahasiswa,merchant,admin',
            'account_status' => 'sometimes|required|in:active,inactive',
        ]);
        if ($validated === []) {
            throw ValidationException::withMessages([
                'user' => ['Pilih peran atau status akun yang akan diubah.'],
            ]);
        }

        $changed = DB::transaction(function () use ($request, $user, $validated) {
            $target = User::query()->lockForUpdate()->findOrFail($user->id);
            $nextRole = $validated['role'] ?? $target->role;
            $nextStatus = $validated['account_status'] ?? $target->account_status;

            if (
                $target->role === 'admin'
                && $target->account_status === 'active'
                && ($nextRole !== 'admin' || $nextStatus !== 'active')
                && !User::query()
                    ->where('role', 'admin')
                    ->where('account_status', 'active')
                    ->where('id', '<>', $target->id)
                    ->exists()
            ) {
                throw ValidationException::withMessages([
                    'user' => ['Perubahan ini akan menonaktifkan admin aktif terakhir.'],
                ]);
            }

            $hasChanged = $target->role !== $nextRole || $target->account_status !== $nextStatus;
            $target->fill([
                'role' => $nextRole,
                'account_status' => $nextStatus,
            ])->save();

            if ($nextRole === 'mahasiswa') {
                StudentProfile::firstOrCreate(['user_id' => $target->id]);
            } elseif ($nextRole === 'merchant') {
                MerchantProfile::firstOrCreate(
                    ['user_id' => $target->id],
                    ['merchant_name' => $target->name, 'phone' => $target->phone]
                );
            }

            if ($hasChanged) {
                $target->tokens()->delete();
            }

            return $hasChanged;
        });

        $user->refresh()->load(['studentProfile', 'merchantProfile']);

        return response()->json([
            'status' => true,
            'message' => $changed
                ? 'Informasi akun berhasil diperbarui.'
                : 'Tidak ada perubahan pada akun.',
            'data' => $this->formatUser($user),
        ]);
    }

    private function formatUser(User $user): array
    {
        $student = $user->role === 'mahasiswa' ? $user->studentProfile : null;
        $merchant = $user->role === 'merchant' ? $user->merchantProfile : null;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'account_status' => $user->account_status,
            'created_at' => $user->created_at,
            'student_profile' => $student ? $student->only([
                'university',
                'faculty',
                'major',
                'nim',
                'is_verified',
                'verification_status',
            ]) : null,
            'merchant_profile' => $merchant ? $merchant->only([
                'merchant_name',
                'category',
                'address',
                'is_verified',
                'verification_status',
            ]) : null,
        ];
    }
}
