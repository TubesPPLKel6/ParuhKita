<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->account_status !== 'active') {
            return response()->json([
                'status' => false,
                'message' => 'Akun ini sedang dinonaktifkan. Hubungi admin untuk bantuan.',
            ], 403);
        }

        return $next($request);
    }
}
