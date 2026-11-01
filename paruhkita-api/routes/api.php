<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\CvController;
use App\Http\Controllers\Api\PortfolioController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - ParuhKita TUB-3
|--------------------------------------------------------------------------
*/

// ============================================================
//  AUTH (publik, tanpa token)
// ============================================================
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
    Route::post('/logout',   [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/me',        [AuthController::class, 'me'])->middleware('auth:sanctum');
});

// ============================================================
//  ROUTES PUBLIK (semua aktor bisa lihat tanpa login)
// ============================================================
Route::prefix('v1')->group(function () {
    // Lihat profil user lain
    Route::get('/profile/{userId}',            [ProfileController::class, 'showPublic']);
    // Lihat portofolio user lain
    Route::get('/portfolio/user/{userId}',     [PortfolioController::class, 'showPublic']);
});

// ============================================================
//  ROUTES PRIVATE (harus login dengan Sanctum token)
// ============================================================
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {

    // --- DASHBOARD ---
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    // --- PROFILE ---
    Route::get('/profile',            [ProfileController::class, 'show']);
    Route::put('/profile',            [ProfileController::class, 'update']);
    Route::post('/profile/photo',     [ProfileController::class, 'uploadPhoto']);

    // --- SKILLS ---
    Route::post('/profile/skills',        [ProfileController::class, 'addSkill']);
    Route::delete('/profile/skills/{id}', [ProfileController::class, 'deleteSkill']);

    // --- AVAILABILITY ---
    Route::put('/profile/availability', [ProfileController::class, 'updateAvailability']);

    // --- CV ---
    Route::get('/cv',                   [CvController::class, 'index']);
    Route::get('/cv/{id}',              [CvController::class, 'show']);
    Route::post('/cv/upload',           [CvController::class, 'upload']);
    Route::post('/cv/builder',          [CvController::class, 'storeBuilder']);
    Route::put('/cv/{id}',              [CvController::class, 'update']);
    Route::patch('/cv/{id}/set-primary', [CvController::class, 'setPrimary']);
    Route::delete('/cv/{id}',           [CvController::class, 'destroy']);

    // --- PORTFOLIO ---
    Route::get('/portfolio',          [PortfolioController::class, 'index']);
    Route::post('/portfolio',         [PortfolioController::class, 'store']);
    Route::get('/portfolio/{id}',     [PortfolioController::class, 'show']);
    Route::put('/portfolio/{id}',     [PortfolioController::class, 'update']);
    Route::delete('/portfolio/{id}',  [PortfolioController::class, 'destroy']);
});
