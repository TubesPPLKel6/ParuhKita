<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use Carbon\Carbon;
use Illuminate\Http\Request;

class StudentApplicationController extends Controller
{
    private const STATUS_LABELS = [
        'pending' => 'Menunggu Review',
        'reviewing' => 'Sedang Ditinjau',
        'interview' => 'Wawancara',
        'trial' => 'Trial Shift',
        'accepted' => 'Diterima',
        'rejected' => 'Ditolak',
    ];

    private const HISTORY_TITLES = [
        'submitted' => 'Terkirim',
        'received' => 'Diterima Sistem',
        'pending' => 'Menunggu Review',
        'reviewing' => 'Lamaran ditinjau',
        'interview' => 'Wawancara dijadwalkan',
        'trial' => 'Trial shift',
        'accepted' => 'Diterima',
        'rejected' => 'Ditolak',
    ];

    private const DAY_NAMES = [
        'Sunday' => 'Minggu', 'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu',
        'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu',
    ];

    private const MONTH_NAMES = [
        1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr', 5 => 'Mei', 6 => 'Jun',
        7 => 'Jul', 8 => 'Agu', 9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des',
    ];

    private const MONTH_FULL = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni',
        7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];

    public function show(Request $request, JobApplication $jobApplication)
    {
        $application = $this->loadApplication($request, $jobApplication);

        $merchant = $application->jobPost?->merchantProfile;
        $student = $application->student;
        $profile = $student?->studentProfile;
        $documents = $application->documents;
        $histories = $application->statusHistories()->get();
        $interview = $application->interviewSchedules
            ->first(fn ($schedule) => $schedule->status !== 'dibatalkan');
        $report = $application->feedbackReport;
        $reportAvailable = $report !== null && $report->status === 'final';

        $status = $application->status;
        $statusLabel = self::STATUS_LABELS[$status] ?? ucfirst($status);

        return response()->json([
            'status' => true,
            'data' => [
                'id' => $application->id,
                'code' => $this->applicationCode($application),
                'status' => $status,
                'status_label' => $statusLabel,
                'status_tone' => $this->statusTone($status),
                'status_since_label' => $this->formatDateTime($application->updated_at),
                'submitted_label' => $this->formatDateTime($application->created_at),
                'submitted_date_label' => $this->formatDate($application->created_at),
                'job' => [
                    'id' => $application->jobPost?->id,
                    'title' => $application->jobPost?->title,
                    'schedule' => $application->jobPost?->schedule,
                ],
                'merchant' => [
                    'id' => $merchant?->id,
                    'merchant_name' => $merchant?->merchant_name,
                    'address' => $merchant?->address,
                    'logo_url' => $this->logoUrl($merchant?->logo_path),
                    'initials' => $this->initials($merchant?->merchant_name),
                ],
                'student' => [
                    'name' => $student?->name,
                    'email' => $student?->email,
                    'phone' => $student?->phone ?? $profile?->phone,
                    'university' => $profile?->university,
                    'major' => $profile?->major,
                    'degree_level' => $profile?->degree_level,
                    'is_currently_studying' => (bool) ($profile?->is_currently_studying ?? true),
                    'initials' => $this->initials($student?->name),
                ],
                'documents' => $documents->map(fn ($document) => [
                    'id' => $document->id,
                    'document_type' => $document->document_type,
                    'label' => $this->documentLabel($document->document_type),
                    'original_name' => $document->original_name,
                    'format' => strtoupper(pathinfo($document->original_name, PATHINFO_EXTENSION)) ?: 'PDF',
                    'size_label' => $this->formatSize($document->file_size),
                    'required' => in_array($document->document_type, ['cv', 'student_id'], true),
                ])->values(),
                'completeness' => $this->completeness($application, $documents),
                'timeline' => $this->timeline($application, $histories, $interview),
                'interview' => $interview ? $this->interviewDetails($interview) : null,
                'interview_performance' => $this->interviewPerformance($application),
                'follow_up' => $this->followUp($application, $status, $reportAvailable),
                'histories' => $histories->map(fn ($history) => [
                    'id' => $history->id,
                    'status' => $history->status,
                    'title' => self::HISTORY_TITLES[$history->status] ?? ucfirst($history->status),
                    'note' => $history->note,
                    'time_label' => $this->formatTime($history->created_at),
                    'date_label' => $this->formatDate($history->created_at),
                    'tone' => $history->status === 'rejected' ? 'danger' : ($history->status === 'accepted' ? 'success' : 'default'),
                ])->values(),
                'feedback' => [
                    'available' => $reportAvailable,
                    'status' => $report?->status,
                    'decided_at_label' => $report?->decided_at ? $this->formatDate($report->decided_at) : null,
                    'scores' => $reportAvailable ? [
                        'cv' => $report->cv_score,
                        'portfolio' => $report->portfolio_score,
                        'skills' => $report->skills_score,
                    ] : null,
                    'summary_scores' => $reportAvailable
                        ? $report->categories->map(fn ($category) => [
                            'key' => 'cat_' . $category->id,
                            'label' => $category->name,
                            'score' => $category->score,
                        ])->values()
                        : null,
                ],
            ],
        ]);
    }

    public function feedbackReport(Request $request, JobApplication $jobApplication)
    {
        $this->loadApplication($request, $jobApplication);

        $report = $jobApplication->feedbackReport;
        abort_unless($report !== null && $report->status === 'final', 404, 'Dokumen masukan belum tersedia.');
        $report->load('categories');

        $application = $jobApplication->loadMissing(['jobPost.merchantProfile', 'student', 'statusHistories']);
        $merchant = $application->jobPost?->merchantProfile;
        $student = $application->student;
        $categories = $report->categories->values();

        $sections = $categories->map(fn ($category, $index) => [
            'number' => str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
            'key' => 'cat_' . $category->id,
            'title' => $category->name,
            'score' => $category->score,
            'note' => $category->note,
        ])->values();

        $scoreByName = fn (string $name) => $categories->firstWhere('name', $name)?->score;

        return response()->json([
            'status' => true,
            'data' => [
                'application_id' => $application->id,
                'code' => $this->applicationCode($application),
                'candidate' => [
                    'name' => $student?->name,
                    'initials' => $this->initials($student?->name),
                    'email' => $student?->email,
                ],
                'job' => [
                    'title' => $application->jobPost?->title,
                ],
                'merchant' => [
                    'merchant_name' => $merchant?->merchant_name,
                    'address' => $merchant?->address,
                ],
                'decision' => [
                    'status' => $application->status,
                    'label' => $application->status === 'rejected' ? 'Belum Diterima / Ditolak' : (self::STATUS_LABELS[$application->status] ?? ucfirst($application->status)),
                    'decided_at_label' => $report->decided_at ? $this->formatDate($report->decided_at) : null,
                    'evaluator' => 'Tim rekrutmen ' . ($merchant?->merchant_name ?? 'merchant'),
                ],
                'document_status_label' => 'Final - Hanya baca',
                'scores' => [
                    'cv' => $scoreByName('Dokumen CV'),
                    'portfolio' => $scoreByName('Portofolio'),
                    'skills' => $scoreByName('Tingkat Keterampilan (Skills)'),
                ],
                'summary_scores' => $categories->map(fn ($category) => [
                    'key' => 'cat_' . $category->id,
                    'label' => $category->name,
                    'score' => $category->score,
                ])->values(),
                'sections' => $sections,
                'recommendations' => $report->recommendations ?? [],
            ],
        ]);
    }

    private function loadApplication(Request $request, JobApplication $jobApplication): JobApplication
    {
        abort_unless($request->user()->role === 'mahasiswa', 403, 'Akses hanya untuk mahasiswa.');
        abort_unless($jobApplication->user_id === $request->user()->id, 404, 'Lamaran tidak ditemukan.');

        return $jobApplication->load([
            'jobPost.merchantProfile:id,merchant_name,address,logo_path',
            'student:id,name,email,phone',
            'student.studentProfile',
            'student.studentAvailabilities',
            'documents',
            'feedbackReport',
            'feedbackReport.categories',
            'interviewSchedules' => fn ($query) => $query
                ->orderByDesc('scheduled_date')
                ->orderByDesc('start_time'),
            'interviewSchedules.evaluation',
        ]);
    }

    private function timeline(JobApplication $application, $histories, $interview): array
    {
        $status = $application->status;
        $merchantName = $application->jobPost?->merchantProfile?->merchant_name ?? 'merchant';
        $jobTitle = $application->jobPost?->title ?? 'posisi ini';

        $historyAt = function (array $statuses) use ($histories) {
            return $histories->first(fn ($history) => in_array($history->status, $statuses, true));
        };

        $stage1At = $historyAt(['submitted']) ?? $application->created_at;
        $stage2At = $historyAt(['received', 'pending']);
        $stage3At = $historyAt(['reviewing']);
        $stage4At = $historyAt(['interview', 'trial']);
        $stage5At = $historyAt(['accepted', 'rejected']);

        $reachedReviewing = in_array($status, ['reviewing', 'interview', 'trial', 'accepted', 'rejected'], true);
        $reachedInterview = in_array($status, ['interview', 'trial', 'accepted', 'rejected'], true);
        $isFinal = in_array($status, ['accepted', 'rejected'], true);

        $stage1 = [
            'key' => 'submitted',
            'title' => 'Lamaran berhasil dikirim',
            'state' => 'done',
            'badge' => 'Selesai',
            'description' => 'Formulir dan seluruh dokumen lamaran berhasil dikirim.',
            'time_label' => $this->formatDateTime($application->created_at),
        ];

        $stage2 = [
            'key' => 'review',
            'title' => 'Lamaran sedang ditinjau',
            'state' => $status === 'pending' ? 'active' : 'done',
            'badge' => $status === 'pending' ? 'Menunggu peninjauan' : 'Selesai',
            'description' => $status === 'pending'
                ? 'Lamaran masuk antrean ' . $merchantName . '. Merchant belum meninjau lamaran ini.'
                : 'Lamaran kamu telah ditinjau oleh ' . $merchantName . ' dan dilanjutkan ke tahap seleksi administrasi.',
            'time_label' => $status === 'pending'
                ? 'Dalam antrean sejak ' . ($stage2At ? $this->formatDateTime($stage2At->created_at) : $this->formatDateTime($application->created_at))
                : ($stage2At ? 'Selesai pada ' . $this->formatDateTime($stage2At->created_at) : null),
        ];

        $stage3 = [
            'key' => 'administration',
            'title' => 'Seleksi administrasi',
            'state' => $reachedReviewing ? 'done' : 'pending',
            'badge' => $reachedReviewing ? 'Selesai' : 'Belum dimulai',
            'description' => $reachedReviewing
                ? 'Biodata dan dokumen lamaran sesuai dengan persyaratan posisi ' . $jobTitle . '.'
                : 'Pemeriksaan kecocokan biodata dan persyaratan akan dimulai setelah peninjauan awal.',
            'time_label' => $stage3At ? 'Selesai pada ' . $this->formatDateTime($stage3At->created_at) : null,
        ];

        $stage4 = [
            'key' => 'interview',
            'title' => 'Wawancara',
            'state' => $isFinal ? 'done' : ($reachedInterview ? 'active' : 'pending'),
            'badge' => $isFinal ? 'Selesai' : ($reachedInterview ? 'Terjadwal' : 'Belum dimulai'),
            'description' => $interview
                ? ($isFinal
                    ? 'Wawancara dengan tim rekrutmen ' . $merchantName . ' telah dilaksanakan.'
                    : 'Wawancara dijadwalkan bersama tim rekrutmen ' . $merchantName . '. Hadir sesuai detail jadwal di bawah.')
                : 'Belum ada jadwal wawancara. Undangan akan muncul jika kamu melanjutkan ke tahap ini.',
            'time_label' => $stage4At ? 'Selesai pada ' . $this->formatDateTime($stage4At->created_at) : null,
            'details' => $interview ? $this->interviewDetails($interview) : null,
        ];

        if ($status === 'accepted') {
            $stage5 = [
                'key' => 'result',
                'title' => 'Hasil akhir seleksi',
                'state' => 'done',
                'badge' => 'Diterima',
                'tone' => 'success',
                'description' => 'Selamat! Kamu diterima sebagai ' . $jobTitle . ' di ' . $merchantName . '. Cek email untuk instruksi onboarding.',
                'time_label' => $stage5At ? 'Diterima pada ' . $this->formatDateTime($stage5At->created_at) : null,
            ];
        } elseif ($status === 'rejected') {
            $stage5 = [
                'key' => 'result',
                'title' => 'Hasil akhir seleksi',
                'state' => 'done',
                'badge' => 'Ditolak',
                'tone' => 'danger',
                'description' => $application->merchant_note
                    ?: 'Mohon maaf, lamaran kamu belum berhasil. Merchant memilih kandidat lain yang dinilai lebih sesuai dengan kebutuhan posisi ' . $jobTitle . '.',
                'time_label' => $stage5At ? 'Ditolak pada ' . $this->formatDateTime($stage5At->created_at) : null,
            ];
        } else {
            $stage5 = [
                'key' => 'result',
                'title' => 'Hasil akhir seleksi',
                'state' => 'pending',
                'badge' => 'Belum dimulai',
                'description' => 'Keputusan Diterima atau Ditolak akan ditampilkan setelah proses seleksi selesai. Belum ada keputusan saat ini.',
                'time_label' => null,
            ];
        }

        $stages = [$stage1, $stage2, $stage3, $stage4, $stage5];
        $tone = in_array($status, ['accepted', 'rejected'], true) ? 'success' : 'default';

        return [
            'caption' => $isFinal
                ? 'Tahap 5 dari 5 · Seluruh tahap selesai. Hasil seleksi sudah keluar.'
                : 'Tahap ' . ($status === 'pending' ? 2 : ($reachedInterview ? 4 : 3)) . ' dari 5 · ' . ($status === 'pending' ? 'Menunggu peninjauan. Satu tahap selesai; tahap berikutnya belum dimulai.' : 'Proses seleksi sedang berjalan.'),
            'stages' => $stages,
            'tone' => $tone,
        ];
    }

    private function interviewPerformance(JobApplication $application): ?array
    {
        $schedule = $application->interviewSchedules
            ->first(fn ($item) => $item->evaluation && $item->evaluation->status === 'final');

        if (!$schedule) {
            return null;
        }

        $evaluation = $schedule->evaluation;
        $criteria = collect($evaluation->criteria ?? [])
            ->map(fn ($criterion) => [
                'label' => $criterion['label'] ?? 'Kriteria',
                'score' => (int) ($criterion['score'] ?? 0),
                'note' => $criterion['note'] ?? null,
            ])
            ->values();

        return [
            'available' => true,
            'total_score' => (int) $evaluation->total_score,
            'max_score' => max(1, $criteria->count()) * 5,
            'recommendation' => $evaluation->recommendation,
            'decision' => $evaluation->decision,
            'feedback' => $evaluation->feedback,
            'criteria' => $criteria,
            'evaluated_at_label' => $evaluation->updated_at ? $this->formatDate($evaluation->updated_at) : null,
            'interview' => $this->interviewDetails($schedule),
        ];
    }

    private function interviewDetails($interview): array
    {        return [
            'date_label' => $this->formatLongDate($interview->scheduled_date),
            'time_label' => str_replace(':', '.', substr($interview->start_time, 0, 5)) . ' – '
                . str_replace(':', '.', substr($interview->end_time, 0, 5)) . ' WIB',
            'method' => $interview->interview_type === 'online' ? 'Online via Google Meet' : 'Tatap muka',
            'location' => $interview->location,
        ];
    }

    private function completeness(JobApplication $application, $documents): array
    {
        $has = fn (string $type) => $documents->contains('document_type', $type);

        $items = [
            ['key' => 'cv', 'label' => 'CV wajib sudah lengkap', 'done' => $has('cv')],
            ['key' => 'student_id', 'label' => 'KTM / bukti mahasiswa aktif terlampir', 'done' => $has('student_id')],
            [
                'key' => 'schedule',
                'label' => 'Persetujuan jadwal sudah diisi',
                'done' => $application->student?->studentAvailabilities->isNotEmpty()
                    || $application->interviewSchedules->isNotEmpty(),
            ],
        ];

        $completed = collect($items)->where('done', true)->count();
        $requiredDone = collect($items)->where('done', true)->whereIn('key', ['cv', 'student_id'])->count();
        $hasPortfolio = $has('portfolio');

        return [
            'complete' => $completed === count($items),
            'badge' => $completed === count($items) ? 'Seluruh persyaratan terpenuhi' : 'Persyaratan belum lengkap',
            'items' => $items,
            'note' => $requiredDone . ' dari 2 dokumen wajib lengkap. Portofolio opsional '
                . ($hasPortfolio ? 'sudah dikirim.' : 'tidak dikirim.'),
            'work_schedule' => $application->jobPost?->schedule,
        ];
    }

    private function followUp(JobApplication $application, string $status, bool $reportAvailable): array
    {
        $merchantName = $application->jobPost?->merchantProfile?->merchant_name ?? 'merchant';
        $email = $application->student?->email ?? 'email kamu';

        return match ($status) {
            'rejected' => [
                'title' => 'Tindak Lanjut',
                'tone' => 'danger',
                'body' => 'Lamaran kamu belum berhasil. Pelajari rekomendasi perbaikan dari merchant agar peluangmu lebih besar di kesempatan berikutnya.',
                'action' => $reportAvailable ? 'Rekomendasi Perbaikan' : null,
            ],
            'accepted' => [
                'title' => 'Tindak Lanjut',
                'tone' => 'info',
                'body' => 'Lamaran kamu diterima. Tim ' . $merchantName . ' akan menghubungi kamu lewat email untuk proses onboarding. Tidak ada tindakan lain yang perlu dilakukan saat ini.',
                'action' => null,
            ],
            'interview', 'trial' => [
                'title' => 'Tindak Lanjut',
                'tone' => 'info',
                'body' => 'Wawancara sudah dijadwalkan. Siapkan diri dan hadir tepat waktu sesuai detail jadwal pada tahap Wawancara. Pantau email ' . $email . ' untuk perubahan jadwal.',
                'action' => null,
            ],
            'reviewing' => [
                'title' => 'Tindak Lanjut',
                'tone' => 'info',
                'body' => 'Lamaran kamu sedang menjalani seleksi administrasi oleh ' . $merchantName . '. Pantau email ' . $email . ' dan notifikasi untuk kabar berikutnya.',
                'action' => null,
            ],
            default => [
                'title' => 'Tindak Lanjut',
                'tone' => 'info',
                'body' => 'Belum ada tindakan wajib. Pantau email ' . $email . ' dan notifikasi untuk kabar review. Lamaran masih dalam antrean peninjauan; belum ada jadwal wawancara.',
                'action' => null,
            ],
        };
    }

    private function statusTone(string $status): string
    {
        return match ($status) {
            'accepted' => 'success',
            'rejected' => 'danger',
            'interview', 'trial' => 'info',
            'reviewing' => 'info',
            default => 'warning',
        };
    }

    private function documentLabel(string $type): string
    {
        return match ($type) {
            'cv' => 'Wajib',
            'student_id' => 'Wajib',
            'portfolio' => 'Opsional',
            default => 'Dokumen',
        };
    }

    private function applicationCode(JobApplication $application): string
    {
        return 'PK-' . $application->created_at->format('Ymd') . '-' . str_pad((string) $application->id, 3, '0', STR_PAD_LEFT);
    }

    private function logoUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        return str_starts_with($path, 'http') ? $path : asset('storage/' . $path);
    }

    private function formatSize(int $bytes): string
    {
        return number_format($bytes / 1048576, 1, ',', '.') . ' MB';
    }

    private function formatTime(Carbon $date): string
    {
        return $date->copy()->timezone('Asia/Jakarta')->format('H.i') . ' WIB';
    }

    private function formatDate(Carbon $date): string
    {
        return $date->day . ' ' . self::MONTH_NAMES[$date->month] . ' ' . $date->year;
    }

    private function formatDateTime(Carbon $date): string
    {
        return $this->formatDate($date) . ' · ' . $this->formatTime($date);
    }

    private function formatLongDate(Carbon $date): string
    {
        return $date->day . ' ' . self::MONTH_FULL[$date->month] . ' ' . $date->year;
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
}
