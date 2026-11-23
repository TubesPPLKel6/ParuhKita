<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $path = $request->path();
        $role = match (true) {
            str_starts_with($path, 'api/v1/admin/') => 'admin',
            str_starts_with($path, 'api/v1/merchant/'),
            str_starts_with($path, 'api/v1/merchants/') => 'merchant',
            str_starts_with($path, 'api/v1/student/'),
            str_starts_with($path, 'api/v1/jobs/'),
            str_starts_with($path, 'api/v1/job-posts/'),
            str_starts_with($path, 'api/v1/profile'),
            str_starts_with($path, 'api/v1/cv'),
            str_starts_with($path, 'api/v1/portfolio'),
            $path === 'api/v1/dashboard/summary' => 'mahasiswa',
            default => null,
        };

        if ($role && $user?->role !== $role) {
            return response()->json([
                'status' => false,
                'message' => 'Akses ditolak untuk peran akun ini.',
            ], 403);
        }

        return $next($request);
    }
}
