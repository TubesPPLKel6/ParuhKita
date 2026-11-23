<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\MerchantProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register user baru (Mahasiswa / Merchant)
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role'     => 'sometimes|in:mahasiswa,merchant',
            'phone'    => 'nullable|string',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => $validated['role'] ?? 'mahasiswa',
            'phone'    => $validated['phone'] ?? null,
        ]);

        // Jika role yang dipilih adalah merchant, buatkan profil merchant awal
        if ($user->role === 'merchant') {
            MerchantProfile::create([
                'user_id'       => $user->id,
                'merchant_name' => $user->name,
                'phone'         => $user->phone,
            ]);
        }

        $user->load('merchantProfile');
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status'  => true,
            'message' => 'Registrasi berhasil',
            'data'    => [
                'user'  => $user,
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * Login
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau kata sandi yang Anda masukkan salah.'],
            ]);
        }

        if ($user->account_status !== 'active') {
            return response()->json([
                'status' => false,
                'message' => 'Akun ini sedang dinonaktifkan. Hubungi admin untuk bantuan.',
            ], 403);
        }

        $user->load('merchantProfile');
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status'  => true,
            'message' => 'Login berhasil',
            'data'    => [
                'user'  => $user,
                'token' => $token,
            ],
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Logout berhasil',
        ]);
    }

    /**
     * Info user login
     */
    public function me(Request $request)
    {
        return response()->json([
            'status' => true,
            'data'   => $request->user()->load('merchantProfile'),
        ]);
    }
}