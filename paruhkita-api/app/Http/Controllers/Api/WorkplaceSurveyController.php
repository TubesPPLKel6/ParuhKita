<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobPost;
use App\Models\MerchantProfile;
use App\Models\WorkplaceSurvey;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WorkplaceSurveyController extends Controller
{
    private const CATEGORIES = ['wage', 'hours', 'safety', 'tasks'];

    public function companies(Request $request)
    {
        abort_unless($request->user()->role === 'mahasiswa', 403, 'Akses hanya untuk mahasiswa.');

        $companies = MerchantProfile::query()
            ->where('is_verified', true)
            ->orderBy('merchant_name')
            ->get(['id', 'merchant_name', 'address', 'category']);

        return response()->json(['status' => true, 'data' => $companies]);
    }

    public function studentSummaries(Request $request)
    {
        abort_unless($request->user()->role === 'mahasiswa', 403, 'Akses hanya untuk mahasiswa.');

        $validated = $request->validate([
            'merchant_ids' => 'required|array|min:1|max:100',
            'merchant_ids.*' => 'required|integer|distinct',
        ]);

        $companies = MerchantProfile::query()
            ->where('is_verified', true)
            ->whereIn('id', $validated['merchant_ids'])
            ->orderBy('merchant_name')
            ->get(['id', 'merchant_name']);
        $surveysByMerchant = WorkplaceSurvey::query()
            ->whereIn('merchant_profile_id', $companies->pluck('id'))
            ->get()
            ->groupBy('merchant_profile_id');

        $summaries = $companies->map(function (MerchantProfile $company) use ($surveysByMerchant) {
            $surveys = $surveysByMerchant->get($company->id, collect());

            return [
                'id' => $company->id,
                'merchant_name' => $company->merchant_name,
                'survey_count' => $surveys->count(),
                'averages' => $this->averages($surveys),
            ];
        });

        return response()->json(['status' => true, 'data' => $summaries]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->role === 'mahasiswa', 403, 'Akses hanya untuk mahasiswa.');

        $rules = [
            'merchant_profile_id' => [
                'required',
                'integer',
                Rule::exists('merchant_profiles', 'id')->where('is_verified', true),
            ],
            'position' => 'required|string|max:120',
            'department' => 'required|string|max:120',
            'start_date' => 'required|date|before_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date|before_or_equal:today',
            'confirmed' => 'accepted',
            'ratings' => ['required', 'array:' . implode(',', self::CATEGORIES)],
            'comments' => 'nullable|string|max:2000',
        ];

        foreach (self::CATEGORIES as $category) {
            $rules["ratings.{$category}"] = 'required|array|size:4';
            $rules["ratings.{$category}.*"] = 'required|integer|between:1,5';
        }

        $validated = $request->validate($rules);
        $survey = WorkplaceSurvey::create([
            'user_id' => $request->user()->id,
            'merchant_profile_id' => $validated['merchant_profile_id'],
            'position' => $validated['position'],
            'department' => $validated['department'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'ratings' => $validated['ratings'],
            'comments' => $validated['comments'] ?? null,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Survei kelayakan berhasil dikirim.',
            'data' => $survey->load('merchantProfile:id,merchant_name,address'),
        ], 201);
    }

    public function merchantIndex(Request $request, MerchantProfile $merchantProfile)
    {
        abort_unless($request->user()->role === 'merchant', 403, 'Akses hanya untuk merchant.');

        $ownedProfile = $request->user()->merchantProfile;
        abort_unless($ownedProfile && $ownedProfile->id === $merchantProfile->id, 404);

        $surveys = WorkplaceSurvey::query()
            ->where('merchant_profile_id', $merchantProfile->id)
            ->latest()
            ->get();

        return response()->json([
            'status' => true,
            'data' => [
                'merchant' => $merchantProfile->only(['id', 'merchant_name']),
                'survey_count' => $surveys->count(),
                'averages' => $this->averages($surveys),
                'surveys' => $surveys->map(fn (WorkplaceSurvey $survey) => $this->formatSurvey($survey)),
            ],
        ]);
    }

    public function jobReviews(Request $request, JobPost $jobPost)
    {
        abort_unless($request->user()->role === 'mahasiswa', 403, 'Akses hanya untuk mahasiswa.');
        abort_unless($jobPost->status === 'active', 404, 'Lowongan tidak tersedia.');

        $merchantProfile = $jobPost->merchantProfile;
        abort_unless($merchantProfile && $merchantProfile->is_verified, 404, 'Tempat kerja tidak tersedia.');

        $surveys = WorkplaceSurvey::query()
            ->where('merchant_profile_id', $merchantProfile->id)
            ->latest()
            ->get();

        return response()->json([
            'status' => true,
            'data' => [
                'merchant' => $merchantProfile->only(['id', 'merchant_name', 'address']),
                'survey_count' => $surveys->count(),
                'averages' => $this->averages($surveys),
                'reviews' => $surveys->map(fn (WorkplaceSurvey $survey) => $this->formatSurvey($survey, public: true)),
            ],
        ]);
    }

    private function averages($surveys): array
    {
        $averages = [];
        foreach (self::CATEGORIES as $category) {
            $scores = $surveys
                ->flatMap(fn (WorkplaceSurvey $survey) => $survey->ratings[$category] ?? [])
                ->filter(fn ($score) => is_numeric($score))
                ->values();
            $averages[$category] = $scores->isEmpty() ? null : round($scores->avg(), 2);
        }

        $categoryAverages = array_filter($averages, fn ($average) => $average !== null);
        $averages['overall'] = $categoryAverages === [] ? null : round(array_sum($categoryAverages) / count($categoryAverages), 2);

        return $averages;
    }

    private function formatSurvey(WorkplaceSurvey $survey, bool $public = false): array
    {
        $ratings = [];
        foreach (self::CATEGORIES as $category) {
            $scores = collect($survey->ratings[$category] ?? [])->filter(fn ($score) => is_numeric($score));
            $ratings[$category] = $scores->isEmpty() ? null : round($scores->avg(), 2);
        }
        $validAverages = array_filter($ratings, fn ($average) => $average !== null);

        return [
            'id' => $survey->id,
            'position' => $survey->position,
            'department' => $survey->department,
            'ratings' => $ratings,
            'question_scores' => $survey->ratings,
            'overall_average' => $validAverages === [] ? null : round(array_sum($validAverages) / count($validAverages), 2),
            'comments' => $survey->comments,
            'created_at' => $survey->created_at,
            ...($public ? [] : [
                'start_date' => $survey->start_date,
                'end_date' => $survey->end_date,
            ]),
        ];
    }
}