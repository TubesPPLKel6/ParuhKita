<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InterviewEvaluation;
use App\Models\InterviewSchedule;
use App\Models\JobApplication;
use App\Models\JobPost;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class MerchantScheduleController extends Controller
{
    /**
     * Kriteria penilaian seleksi (mengikuti desain Formulir Penilaian Seleksi).
     */
    public const CRITERIA = [
        ['key' => 'komunikasi', 'label' => 'Komunikasi & Sikap'],
        ['key' => 'kesesuaian_jadwal', 'label' => 'Kesesuaian Jadwal'],
        ['key' => 'pengalaman', 'label' => 'Pengalaman Relevan'],
        ['key' => 'motivasi', 'label' => 'Motivasi & Ketertarikan'],
        ['key' => 'kesiapan', 'label' => 'Kesiapan Kerja'],
    ];

    private const DAY_NAMES = [
        'Sunday' => 'Minggu',
        'Monday' => 'Senin',
        'Tuesday' => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday' => 'Kamis',
        'Friday' => 'Jumat',
        'Saturday' => 'Sabtu',
    ];

    private const MONTH_NAMES = [
        1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr', 5 => 'Mei', 6 => 'Jun',
        7 => 'Jul', 8 => 'Agu', 9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des',
    ];

    public function index(Request $request)
    {
        $profile = $this->merchantProfile($request);

        $validated = $request->validate([
            'week_start' => 'nullable|date',
            'job_post_id' => 'nullable|integer',
            'status' => 'nullable|string',
            'search' => 'nullable|string|max:100',
            'type' => 'nullable|in:all,wawancara',
        ]);

        $weekStart = !empty($validated['week_start'])
            ? Carbon::parse($validated['week_start'])->startOfWeek(Carbon::MONDAY)
            : Carbon::now()->startOfWeek(Carbon::MONDAY);

        $weekStart->startOfDay();
        $weekEnd = $weekStart->copy()->addDays(6)->endOfDay();

        $baseQuery = InterviewSchedule::query()
            ->where('merchant_profile_id', $profile->id);

        $weekQuery = (clone $baseQuery)
            ->whereBetween('scheduled_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->with([
                'candidate:id,name,email',
                'candidate.studentProfile:id,user_id,university,major,degree_level',
                'jobPost:id,title',
                'evaluation:id,interview_schedule_id,status',
            ])
            ->orderBy('scheduled_date')
            ->orderBy('start_time');

        if (!empty($validated['job_post_id'])) {
            $weekQuery->where('job_post_id', $validated['job_post_id']);
        }

        if (!empty($validated['status']) && $validated['status'] !== 'semua') {
            $weekQuery->where('status', $validated['status']);
        }

        if (!empty($validated['search'])) {
            $term = '%' . $validated['search'] . '%';
            $weekQuery->whereHas('candidate', fn ($query) => $query->where('name', 'like', $term));
        }

        $schedules = $weekQuery->get()->map(fn (InterviewSchedule $schedule) => $this->presentSchedule($schedule));

        $upcoming = (clone $baseQuery)
            ->whereDate('scheduled_date', '>=', Carbon::now()->toDateString())
            ->where('status', '!=', 'dibatalkan')
            ->with([
                'candidate:id,name,email',
                'candidate.studentProfile:id,user_id,university,major,degree_level',
                'jobPost:id,title',
                'evaluation:id,interview_schedule_id,status',
            ])
            ->orderBy('scheduled_date')
            ->orderBy('start_time')
            ->limit(10)
            ->get()
            ->map(fn (InterviewSchedule $schedule) => $this->presentSchedule($schedule));

        $jobPosts = $profile->jobPosts()
            ->orderBy('title')
            ->get(['id', 'title']);

        return response()->json([
            'status' => true,
            'data' => [
                'week' => [
                    'start' => $weekStart->toDateString(),
                    'end' => $weekEnd->toDateString(),
                    'label' => 'Minggu ke-' . (int) ceil($weekStart->day / 7) . ' ' . $this->monthName($weekStart->month) . ' ' . $weekStart->year,
                    'range' => $weekStart->day . ' – ' . $weekEnd->day . ' ' . $this->monthName($weekStart->month) . ' ' . $weekStart->year,
                ],
                'schedules' => $schedules,
                'upcoming' => $upcoming,
                'counts' => [
                    'all' => (clone $baseQuery)->where('status', '!=', 'dibatalkan')->count(),
                    'wawancara' => (clone $baseQuery)->where('status', '!=', 'dibatalkan')->count(),
                    'upcoming' => $upcoming->count(),
                ],
                'job_posts' => $jobPosts,
                'merchant' => $this->presentMerchant($profile),
                'today' => Carbon::now()->toDateString(),
            ],
        ]);
    }

    /**
     * Kandidat yang bisa dijadwalkan (pelamar pada lowongan merchant).
     */
    public function candidates(Request $request)
    {
        $profile = $this->merchantProfile($request);

        $applications = JobApplication::query()
            ->whereHas('jobPost', fn ($query) => $query->where('merchant_profile_id', $profile->id))
            ->whereIn('status', ['pending', 'reviewing', 'interview', 'trial', 'accepted'])
            ->with([
                'student:id,name,email',
                'student.studentProfile:id,user_id,university,major,degree_level',
                'student.studentAvailabilities',
                'jobPost:id,title',
                'interviewSchedules' => fn ($query) => $query->where('status', '!=', 'dibatalkan'),
            ])
            ->latest()
            ->get();

        $data = $applications->map(function (JobApplication $application) {
            $profile = $application->student?->studentProfile;

            return [
                'application_id' => $application->id,
                'job_post_id' => $application->job_post_id,
                'job_title' => $application->jobPost?->title,
                'status' => $application->status,
                'candidate' => [
                    'id' => $application->student?->id,
                    'name' => $application->student?->name,
                    'initials' => $this->initials($application->student?->name),
                    'university' => $profile?->university,
                    'major' => $profile?->major,
                    'degree_level' => $profile?->degree_level,
                ],
                'availability' => $application->student?->studentAvailabilities
                    ->map(fn ($availability) => [
                        'id' => $availability->id,
                        'day_of_week' => $availability->day_of_week,
                        'start_time' => substr($availability->start_time, 0, 5),
                        'end_time' => substr($availability->end_time, 0, 5),
                        'label' => $availability->day_of_week . ', '
                            . str_replace(':', '.', substr($availability->start_time, 0, 5))
                            . ' – '
                            . str_replace(':', '.', substr($availability->end_time, 0, 5)),
                    ])->values(),
                'scheduled' => $application->interviewSchedules->isNotEmpty(),
            ];
        });

        return response()->json([
            'status' => true,
            'data' => [
                'candidates' => $data,
                'criteria' => self::CRITERIA,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $profile = $this->merchantProfile($request);
        $validated = $this->validatePayload($request);

        $application = JobApplication::with('jobPost')->findOrFail($validated['job_application_id']);
        abort_unless($application->jobPost?->merchant_profile_id === $profile->id, 404, 'Lamaran tidak ditemukan.');

        $this->ensureNoConflict($profile->id, $validated['scheduled_date'], $validated['start_time'], $validated['end_time']);

        $schedule = DB::transaction(function () use ($profile, $application, $validated) {
            $schedule = InterviewSchedule::create([
                'merchant_profile_id' => $profile->id,
                'job_post_id' => $application->job_post_id,
                'job_application_id' => $application->id,
                'user_id' => $application->user_id,
                'interview_type' => $validated['interview_type'] ?? 'tatap_muka',
                'scheduled_date' => $validated['scheduled_date'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'location' => $validated['location'],
                'status' => 'dikonfirmasi',
                'availability_label' => $validated['availability_label'] ?? null,
                'note' => $validated['note'] ?? null,
            ]);

            if (in_array($application->status, ['pending', 'reviewing'], true)) {
                $application->update(['status' => 'interview']);
                $application->statusHistories()->create([
                    'status' => 'interview',
                    'note' => 'Jadwal wawancara dibuat oleh merchant.',
                ]);
            }

            return $schedule;
        });

        return response()->json([
            'status' => true,
            'message' => 'Jadwal wawancara berhasil dibuat.',
            'data' => $this->presentSchedule($this->loadSchedule($schedule)),
        ], 201);
    }

    public function update(Request $request, InterviewSchedule $schedule)
    {
        $profile = $this->merchantProfile($request);
        abort_unless($schedule->merchant_profile_id === $profile->id, 404, 'Jadwal tidak ditemukan.');

        $validated = $request->validate([
            'job_application_id' => 'sometimes|integer',
            'interview_type' => ['sometimes', Rule::in(['tatap_muka', 'online'])],
            'scheduled_date' => 'sometimes|date',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i',
            'location' => 'sometimes|string|max:500',
            'availability_label' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:1000',
            'status' => ['sometimes', Rule::in(['terjadwal', 'dikonfirmasi', 'selesai', 'dibatalkan'])],
        ]);

        $application = null;
        if (isset($validated['job_application_id'])) {
            $application = JobApplication::with('jobPost')->findOrFail($validated['job_application_id']);
            abort_unless($application->jobPost?->merchant_profile_id === $profile->id, 404, 'Lamaran tidak ditemukan.');
        }

        $date = $validated['scheduled_date'] ?? $schedule->scheduled_date->toDateString();
        $start = $validated['start_time'] ?? substr($schedule->start_time, 0, 5);
        $end = $validated['end_time'] ?? substr($schedule->end_time, 0, 5);

        if ($end <= $start) {
            throw ValidationException::withMessages([
                'end_time' => ['Waktu selesai harus lebih besar dari waktu mulai.'],
            ]);
        }

        if (($validated['status'] ?? $schedule->status) !== 'dibatalkan') {
            $this->ensureNoConflict($profile->id, $date, $start, $end, $schedule->id);
        }

        $schedule->fill([
            'interview_type' => $validated['interview_type'] ?? $schedule->interview_type,
            'scheduled_date' => $date,
            'start_time' => $start,
            'end_time' => $end,
            'location' => $validated['location'] ?? $schedule->location,
            'availability_label' => array_key_exists('availability_label', $validated)
                ? $validated['availability_label']
                : $schedule->availability_label,
            'note' => array_key_exists('note', $validated) ? $validated['note'] : $schedule->note,
            'status' => $validated['status'] ?? $schedule->status,
        ]);

        if ($application) {
            $schedule->job_post_id = $application->job_post_id;
            $schedule->job_application_id = $application->id;
            $schedule->user_id = $application->user_id;
        }

        $schedule->save();

        return response()->json([
            'status' => true,
            'message' => 'Jadwal wawancara berhasil diperbarui.',
            'data' => $this->presentSchedule($this->loadSchedule($schedule)),
        ]);
    }

    public function destroy(Request $request, InterviewSchedule $schedule)
    {
        $profile = $this->merchantProfile($request);
        abort_unless($schedule->merchant_profile_id === $profile->id, 404, 'Jadwal tidak ditemukan.');

        $schedule->delete();

        return response()->json([
            'status' => true,
            'message' => 'Jadwal wawancara berhasil dihapus.',
        ]);
    }

    public function showEvaluation(Request $request, InterviewSchedule $schedule)
    {
        $profile = $this->merchantProfile($request);
        abort_unless($schedule->merchant_profile_id === $profile->id, 404, 'Jadwal tidak ditemukan.');

        $evaluation = $schedule->evaluation;

        return response()->json([
            'status' => true,
            'data' => [
                'schedule' => $this->presentSchedule($this->loadSchedule($schedule)),
                'criteria' => self::CRITERIA,
                'evaluation' => $evaluation ? $this->presentEvaluation($evaluation) : null,
            ],
        ]);
    }

    public function saveEvaluation(Request $request, InterviewSchedule $schedule)
    {
        $profile = $this->merchantProfile($request);
        abort_unless($schedule->merchant_profile_id === $profile->id, 404, 'Jadwal tidak ditemukan.');

        $validated = $request->validate([
            'criteria' => 'required|array',
            'criteria.*.score' => 'nullable|integer|min:0|max:5',
            'criteria.*.note' => 'nullable|string|max:1000',
            'feedback' => 'nullable|string|max:2000',
            'send_feedback' => 'nullable|boolean',
            'decision' => ['nullable', Rule::in(['terima', 'tolak', 'tahan'])],
            'status' => ['required', Rule::in(['draft', 'final'])],
        ]);

        $criteria = [];
        $total = 0;
        foreach (self::CRITERIA as $criterion) {
            $entry = $validated['criteria'][$criterion['key']] ?? [];
            $score = isset($entry['score']) ? (int) $entry['score'] : 0;
            $criteria[$criterion['key']] = [
                'label' => $criterion['label'],
                'score' => $score,
                'note' => $entry['note'] ?? null,
            ];
            $total += $score;
        }

        $isFinal = $validated['status'] === 'final';
        if ($isFinal) {
            $missing = collect($criteria)->filter(fn ($criterion) => $criterion['score'] < 1)->keys();
            if ($missing->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'criteria' => ['Semua kriteria wajib diberi nilai sebelum penilaian dikirim.'],
                ]);
            }
            if (empty($validated['decision'])) {
                throw ValidationException::withMessages([
                    'decision' => ['Keputusan seleksi wajib dipilih sebelum penilaian dikirim.'],
                ]);
            }
        }

        $evaluation = DB::transaction(function () use ($schedule, $validated, $criteria, $total, $isFinal) {
            $evaluation = InterviewEvaluation::updateOrCreate(
                ['interview_schedule_id' => $schedule->id],
                [
                    'job_application_id' => $schedule->job_application_id,
                    'criteria' => $criteria,
                    'total_score' => $total,
                    'recommendation' => $this->recommendation($total),
                    'feedback' => $validated['feedback'] ?? null,
                    'send_feedback' => (bool) ($validated['send_feedback'] ?? false),
                    'decision' => $validated['decision'] ?? null,
                    'status' => $validated['status'],
                ]
            );

            $application = $schedule->application;

            if ($application) {
                if ($isFinal && $evaluation->decision) {
                    $newStatus = match ($evaluation->decision) {
                        'terima' => 'accepted',
                        'tolak' => 'rejected',
                        default => 'reviewing',
                    };

                    if ($application->status !== $newStatus) {
                        $application->update(['status' => $newStatus]);
                        $application->statusHistories()->create([
                            'status' => $newStatus,
                            'note' => $evaluation->feedback,
                        ]);
                    }
                }

                if ($isFinal && $evaluation->send_feedback && $evaluation->feedback) {
                    $application->update(['merchant_note' => $evaluation->feedback]);
                }
            }

            return $evaluation;
        });

        return response()->json([
            'status' => true,
            'message' => $isFinal ? 'Penilaian seleksi berhasil dikirim.' : 'Draf penilaian berhasil disimpan.',
            'data' => [
                'evaluation' => $this->presentEvaluation($evaluation),
                'schedule' => $this->presentSchedule($this->loadSchedule($schedule)),
            ],
        ]);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'job_application_id' => 'required|integer',
            'interview_type' => ['nullable', Rule::in(['tatap_muka', 'online'])],
            'scheduled_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'location' => 'required|string|max:500',
            'availability_label' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:1000',
        ]);
    }

    private function ensureNoConflict(int $merchantProfileId, string $date, string $start, string $end, ?int $ignoreId = null): void
    {
        $conflict = InterviewSchedule::query()
            ->where('merchant_profile_id', $merchantProfileId)
            ->whereDate('scheduled_date', $date)
            ->where('status', '!=', 'dibatalkan')
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->where('start_time', '<', $end)
            ->where('end_time', '>', $start)
            ->exists();

        if ($conflict) {
            throw ValidationException::withMessages([
                'start_time' => ['Sudah ada jadwal lain pada waktu tersebut.'],
            ]);
        }
    }

    private function loadSchedule(InterviewSchedule $schedule): InterviewSchedule
    {
        return $schedule->fresh([
            'candidate:id,name,email',
            'candidate.studentProfile:id,user_id,university,major,degree_level',
            'jobPost:id,title',
            'evaluation:id,interview_schedule_id,status',
        ]);
    }

    private function presentSchedule(InterviewSchedule $schedule): array
    {
        $profile = $schedule->candidate?->studentProfile;
        $start = substr((string) $schedule->start_time, 0, 5);
        $end = substr((string) $schedule->end_time, 0, 5);

        return [
            'id' => $schedule->id,
            'job_application_id' => $schedule->job_application_id,
            'job_post_id' => $schedule->job_post_id,
            'user_id' => $schedule->user_id,
            'candidate' => [
                'id' => $schedule->candidate?->id,
                'name' => $schedule->candidate?->name,
                'initials' => $this->initials($schedule->candidate?->name),
                'university' => $profile?->university,
                'major' => $profile?->major,
                'degree_level' => $profile?->degree_level,
            ],
            'job' => [
                'id' => $schedule->jobPost?->id,
                'title' => $schedule->jobPost?->title,
            ],
            'interview_type' => $schedule->interview_type,
            'type_label' => $schedule->interview_type === 'online' ? 'Wawancara Online' : 'Wawancara Tatap Muka',
            'scheduled_date' => $schedule->scheduled_date->toDateString(),
            'date_label' => $this->indonesianDate($schedule->scheduled_date),
            'start_time' => $start,
            'end_time' => $end,
            'start_label' => str_replace(':', '.', $start),
            'end_label' => str_replace(':', '.', $end),
            'time_label' => str_replace(':', '.', $start) . ' – ' . str_replace(':', '.', $end) . ' WIB',
            'location' => $schedule->location,
            'status' => $schedule->status,
            'status_label' => $schedule->status === 'dikonfirmasi' ? 'Dikonfirmasi' : ucfirst($schedule->status),
            'availability_label' => $schedule->availability_label,
            'note' => $schedule->note,
            'has_evaluation' => (bool) $schedule->evaluation,
            'evaluation_status' => $schedule->evaluation?->status,
        ];
    }

    private function presentEvaluation(InterviewEvaluation $evaluation): array
    {
        return [
            'id' => $evaluation->id,
            'interview_schedule_id' => $evaluation->interview_schedule_id,
            'job_application_id' => $evaluation->job_application_id,
            'criteria' => $evaluation->criteria,
            'total_score' => $evaluation->total_score,
            'max_score' => count(self::CRITERIA) * 5,
            'recommendation' => $evaluation->recommendation,
            'feedback' => $evaluation->feedback,
            'send_feedback' => $evaluation->send_feedback,
            'decision' => $evaluation->decision,
            'status' => $evaluation->status,
        ];
    }

    private function presentMerchant($profile): array
    {
        $logoUrl = $profile->logo_path
            ? (str_starts_with($profile->logo_path, 'http') ? $profile->logo_path : asset('storage/' . $profile->logo_path))
            : null;

        return [
            'id' => $profile->id,
            'merchant_name' => $profile->merchant_name,
            'address' => $profile->address,
            'logo_url' => $logoUrl,
            'is_verified' => (bool) $profile->is_verified,
            'job_count' => $profile->jobPosts()->count(),
            'candidate_count' => JobApplication::whereHas(
                'jobPost',
                fn ($query) => $query->where('merchant_profile_id', $profile->id)
            )->count(),
        ];
    }

    private function recommendation(int $total): string
    {
        if ($total >= 22) {
            return 'Sangat Direkomendasikan';
        }
        if ($total >= 17) {
            return 'Direkomendasikan';
        }
        if ($total >= 12) {
            return 'Cukup';
        }

        return 'Belum Direkomendasikan';
    }

    private function indonesianDate(Carbon $date): string
    {
        return self::DAY_NAMES[$date->format('l')] . ', ' . $date->day . ' ' . $this->monthName($date->month) . ' ' . $date->year;
    }

    private function monthName(int $month): string
    {
        return self::MONTH_NAMES[$month] ?? '';
    }

    private function initials(?string $name): string
    {
        if (!$name) {
            return 'NA';
        }

        return collect(explode(' ', trim($name)))
            ->filter()
            ->take(2)
            ->map(fn ($part) => mb_strtoupper(mb_substr($part, 0, 1)))
            ->implode('');
    }

    private function merchantProfile(Request $request)
    {
        abort_unless($request->user()->role === 'merchant', 403, 'Akses hanya untuk merchant.');
        $profile = $request->user()->merchantProfile;
        abort_unless($profile !== null, 403, 'Profil usaha belum dibuat.');

        return $profile;
    }
}
