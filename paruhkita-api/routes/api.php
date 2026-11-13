<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\CvController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\MerchantVerificationController;
use App\Http\Controllers\Api\MerchantProfileController;
use App\Http\Controllers\Api\AdminReferenceDataController;
use App\Http\Controllers\Api\ReferenceDataController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\WorkplaceSurveyController;
use App\Http\Controllers\Api\StudentVerificationController;
use App\Http\Controllers\Api\AdminVerificationController;
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
    Route::get('/companies/{merchantProfileId}', [MerchantProfileController::class, 'showPublic']);
});

// ============================================================
//  ROUTES PRIVATE (harus login dengan Sanctum token)
// ============================================================
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {

    Route::get('/reference/job-categories', [ReferenceDataController::class, 'jobCategories']);
    Route::get('/student/workplace-surveys/companies', [WorkplaceSurveyController::class, 'companies']);
    Route::get('/student/workplace-survey-reviews', [WorkplaceSurveyController::class, 'studentSummaries']);
    Route::post('/student/workplace-surveys', [WorkplaceSurveyController::class, 'store']);
    Route::get('/job-posts/{jobPost}/merchant-reviews', [WorkplaceSurveyController::class, 'jobReviews']);
    Route::get('/merchants/{merchantProfile}/surveys', [WorkplaceSurveyController::class, 'merchantIndex']);
    Route::get('/jobs', [JobController::class, 'index']);
    Route::get('/jobs/{jobPost}', [JobController::class, 'show']);
    Route::post('/jobs/{jobPost}/applications', [JobController::class, 'apply']);
    Route::get('/student/applications', [JobController::class, 'studentApplications']);
    Route::get('/student/applications/{jobApplication}/documents/{documentId}', [JobController::class, 'downloadApplicationDocument']);
    Route::get('/merchant/jobs', [JobController::class, 'merchantIndex']);
    Route::post('/merchant/jobs', [JobController::class, 'store']);
    Route::put('/merchant/jobs/{jobPost}', [JobController::class, 'update']);
    Route::delete('/merchant/jobs/{jobPost}', [JobController::class, 'destroy']);
    Route::patch('/merchant/applications/{jobApplication}', [JobController::class, 'updateApplication']);

    Route::get('/merchant/jobs/{jobPost}/applicants', [JobController::class, 'merchantJobApplicants']);
    Route::get('/merchant/applications/{jobApplication}', [JobController::class, 'merchantApplicationDetail']);
    Route::get('/merchant/applications/{jobApplication}/documents/{documentId}', [JobController::class, 'merchantDownloadDocument']);


    Route::prefix('admin/reference-data')->group(function () {
        Route::get('/', [AdminReferenceDataController::class, 'index']);
        Route::post('/campuses', [AdminReferenceDataController::class, 'storeCampus']);
        Route::put('/campuses/{campus}', [AdminReferenceDataController::class, 'updateCampus']);
        Route::delete('/campuses/{campus}', [AdminReferenceDataController::class, 'destroyCampus']);
        Route::post('/study-programs', [AdminReferenceDataController::class, 'storeStudyProgram']);
        Route::put('/study-programs/{studyProgram}', [AdminReferenceDataController::class, 'updateStudyProgram']);
        Route::delete('/study-programs/{studyProgram}', [AdminReferenceDataController::class, 'destroyStudyProgram']);
        Route::post('/job-categories', [AdminReferenceDataController::class, 'storeJobCategory']);
        Route::put('/job-categories/{jobCategory}', [AdminReferenceDataController::class, 'updateJobCategory']);
        Route::delete('/job-categories/{jobCategory}', [AdminReferenceDataController::class, 'destroyJobCategory']);
        Route::post('/job-subcategories', [AdminReferenceDataController::class, 'storeJobSubcategory']);
        Route::put('/job-subcategories/{jobSubcategory}', [AdminReferenceDataController::class, 'updateJobSubcategory']);
        Route::delete('/job-subcategories/{jobSubcategory}', [AdminReferenceDataController::class, 'destroyJobSubcategory']);
    });

    Route::get('/merchant/profile', [MerchantProfileController::class, 'show']);
    Route::put('/merchant/profile', [MerchantProfileController::class, 'update']);
    Route::delete('/merchant/profile', [MerchantProfileController::class, 'destroy']);

    Route::post('/merchant/verification', [MerchantVerificationController::class, 'submit']);
    Route::post('/student/verification', [StudentVerificationController::class, 'submit']);
    Route::get('/student/verification-status', [StudentVerificationController::class, 'status']);
    Route::get('/admin/verifications', [AdminVerificationController::class, 'index']);
    Route::get('/admin/verifications/{type}/{profileId}/document', [AdminVerificationController::class, 'streamDocument']);
    Route::get('/admin/verifications/{type}/{profileId}/documents/{documentId}', [AdminVerificationController::class, 'streamDocument']);
    Route::post('/admin/verifications/batch-approve', [AdminVerificationController::class, 'batchApprove']);
    Route::post('/admin/verifications/{type}/{id}/approve', [AdminVerificationController::class, 'approve']);
    Route::post('/admin/verifications/{type}/{id}/request-revision', [AdminVerificationController::class, 'requestRevision']);
    Route::post('/admin/verifications/{type}/{id}/reject', [AdminVerificationController::class, 'reject']);
    Route::get('/admin/merchant-verifications', [MerchantVerificationController::class, 'index']);
    Route::get('/admin/merchant-verifications/documents/{document}', [MerchantVerificationController::class, 'downloadDocument']);
    Route::post('/admin/merchant-verifications/{merchantProfile}/approve', [MerchantVerificationController::class, 'approve']);
    Route::post('/admin/merchant-verifications/{merchantProfile}/reject', [MerchantVerificationController::class, 'reject']);

    // --- DASHBOARD ---
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/admin/dashboard', [DashboardController::class, 'adminSummary']);

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
