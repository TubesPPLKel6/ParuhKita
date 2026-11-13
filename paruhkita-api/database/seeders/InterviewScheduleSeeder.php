<?php

namespace Database\Seeders;

use App\Models\InterviewEvaluation;
use App\Models\InterviewSchedule;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\StudentAvailability;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class InterviewScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $merchant = User::where('email', 'merchant@paruhkita.test')->first();
        $profile = $merchant?->merchantProfile;

        if (!$merchant || !$profile) {
            $this->command?->warn('Akun merchant belum ada. Jalankan DatabaseSeeder terlebih dahulu.');

            return;
        }

        $barista = JobPost::where('merchant_profile_id', $profile->id)->where('title', 'Barista Paruh Waktu')->first();
        $pramusaji = JobPost::where('merchant_profile_id', $profile->id)->where('title', 'Pramusaji Akhir Pekan')->first();

        if (!$barista || !$pramusaji) {
            $this->command?->warn('Lowongan demo belum ada. Jalankan DatabaseSeeder terlebih dahulu.');

            return;
        }

        $students = [
            ['name' => 'Rizky Pratama', 'email' => 'rizky@paruhkita.test', 'university' => 'Universitas Gadjah Mada', 'major' => 'Manajemen', 'degree_level' => 'S1'],
            ['name' => 'Nadia Aulia', 'email' => 'nadia@paruhkita.test', 'university' => 'Universitas Gadjah Mada', 'major' => 'Manajemen', 'degree_level' => 'S1'],
            ['name' => 'Bima Aditya', 'email' => 'bima@paruhkita.test', 'university' => 'Universitas Islam Indonesia', 'major' => 'Informatika', 'degree_level' => 'S1'],
            ['name' => 'Salsabila Putri', 'email' => 'salsabila@paruhkita.test', 'university' => 'Universitas Gadjah Mada', 'major' => 'Ilmu Komunikasi', 'degree_level' => 'S1'],
            ['name' => 'Dimas Aryo', 'email' => 'dimas@paruhkita.test', 'university' => 'Universitas Negeri Yogyakarta', 'major' => 'Pendidikan Ekonomi', 'degree_level' => 'S1'],
            ['name' => 'Intan Permata', 'email' => 'intan@paruhkita.test', 'university' => 'Universitas Islam Indonesia', 'major' => 'Akuntansi', 'degree_level' => 'S1'],
        ];

        $applications = [];

        foreach ($students as $index => $studentData) {
            $student = User::firstOrCreate(
                ['email' => $studentData['email']],
                [
                    'name' => $studentData['name'],
                    'password' => Hash::make('password123'),
                    'role' => 'mahasiswa',
                ]
            );

            $student->studentProfile()->firstOrCreate(
                ['user_id' => $student->id],
                [
                    'university' => $studentData['university'],
                    'major' => $studentData['major'],
                    'degree_level' => $studentData['degree_level'],
                    'is_currently_studying' => true,
                    'gpa' => 3.5,
                ]
            );

            if ($student->studentAvailabilities()->count() === 0) {
                foreach ([
                    ['day_of_week' => 'Senin', 'start_time' => '09:00', 'end_time' => '13:00'],
                    ['day_of_week' => 'Rabu', 'start_time' => '09:00', 'end_time' => '17:00'],
                    ['day_of_week' => 'Jumat', 'start_time' => '13:00', 'end_time' => '18:00'],
                ] as $availability) {
                    StudentAvailability::create($availability + [
                        'user_id' => $student->id,
                        'hours_per_day' => 4,
                    ]);
                }
            }

            $job = $index % 2 === 0 ? $barista : $pramusaji;

            $applications[$studentData['email']] = JobApplication::firstOrCreate(
                ['job_post_id' => $job->id, 'user_id' => $student->id],
                ['status' => 'interview']
            );
        }

        $wednesday = Carbon::now()->startOfWeek(Carbon::MONDAY)->addDays(2);
        if ($wednesday->isPast()) {
            $wednesday->addWeek();
        }
        $wednesday->setTime(0, 0);

        $schedules = [
            ['email' => 'rizky@paruhkita.test', 'date' => $wednesday->copy(), 'start' => '09:00', 'end' => '09:30', 'status' => 'terjadwal'],
            ['email' => 'nadia@paruhkita.test', 'date' => $wednesday->copy(), 'start' => '16:00', 'end' => '16:30', 'status' => 'dikonfirmasi'],
            ['email' => 'bima@paruhkita.test', 'date' => $wednesday->copy(), 'start' => '16:30', 'end' => '17:00', 'status' => 'dikonfirmasi'],
            ['email' => 'salsabila@paruhkita.test', 'date' => $wednesday->copy()->subWeek(), 'start' => '10:00', 'end' => '10:30', 'status' => 'selesai'],
            ['email' => 'dimas@paruhkita.test', 'date' => $wednesday->copy()->subWeek(), 'start' => '13:00', 'end' => '13:30', 'status' => 'selesai'],
            ['email' => 'intan@paruhkita.test', 'date' => $wednesday->copy()->subWeeks(2), 'start' => '11:00', 'end' => '11:30', 'status' => 'selesai'],
            ['email' => 'rizky@paruhkita.test', 'date' => $wednesday->copy()->subWeeks(2), 'start' => '14:00', 'end' => '14:30', 'status' => 'selesai'],
        ];

        foreach ($schedules as $entry) {
            $application = $applications[$entry['email']] ?? null;
            if (!$application) {
                continue;
            }

            InterviewSchedule::firstOrCreate(
                [
                    'job_application_id' => $application->id,
                    'scheduled_date' => $entry['date']->toDateString(),
                    'start_time' => $entry['start'],
                ],
                [
                    'merchant_profile_id' => $profile->id,
                    'job_post_id' => $application->job_post_id,
                    'user_id' => $application->user_id,
                    'interview_type' => 'tatap_muka',
                    'end_time' => $entry['end'],
                    'location' => 'Kopi Sela Outlet Gejayan',
                    'status' => $entry['status'],
                    'availability_label' => 'Rabu, 09.00 – 17.00',
                ]
            );
        }

        $nadiaSchedule = InterviewSchedule::where('user_id', $applications['nadia@paruhkita.test']->user_id)
            ->where('status', 'dikonfirmasi')
            ->first();

        if ($nadiaSchedule) {
            InterviewEvaluation::updateOrCreate(
                ['interview_schedule_id' => $nadiaSchedule->id],
                [
                    'job_application_id' => $nadiaSchedule->job_application_id,
                    'criteria' => [
                        'komunikasi' => ['label' => 'Komunikasi & Sikap', 'score' => 4, 'note' => 'Nadia komunikatif dan sopan. Menjawab pertanyaan dengan percaya diri.'],
                        'kesesuaian_jadwal' => ['label' => 'Kesesuaian Jadwal', 'score' => 5, 'note' => 'Jadwal kuliah sangat cocok dengan shift sore kami.'],
                        'pengalaman' => ['label' => 'Pengalaman Relevan', 'score' => 4, 'note' => 'Punya pengalaman di Roti Pagi dan Dapur Kampus, familiar dengan POS.'],
                        'motivasi' => ['label' => 'Motivasi & Ketertarikan', 'score' => 5, 'note' => 'Sangat antusias dengan dunia F&B dan pelayanan pelanggan.'],
                        'kesiapan' => ['label' => 'Kesiapan Kerja', 'score' => 4, 'note' => 'KTM aktif, CV lengkap, sertifikat barista dasar sudah ada.'],
                    ],
                    'total_score' => 22,
                    'recommendation' => 'Sangat Direkomendasikan',
                    'feedback' => 'Hai Nadia, performa wawancaramu sangat baik! Kami terkesan dengan pengalamanmu di bidang F&B. Saran kami, pelajari sedikit tentang latte art karena itu menjadi nilai tambah di outlet kami. Kami akan menghubungimu untuk tahap selanjutnya.',
                    'send_feedback' => true,
                    'decision' => 'terima',
                    'status' => 'final',
                ]
            );
        }

        $this->command?->info('Seeder jadwal selesai: 7 jadwal dan 1 penilaian contoh dibuat.');
    }
}
