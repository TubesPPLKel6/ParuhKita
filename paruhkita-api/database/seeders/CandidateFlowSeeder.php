<?php

namespace Database\Seeders;

use App\Models\ApplicationFeedbackReport;
use App\Models\InterviewSchedule;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\StudentAvailability;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class CandidateFlowSeeder extends Seeder
{
    public function run(): void
    {
        $merchant = User::where('email', 'merchant@paruhkita.test')->first();
        $profile = $merchant?->merchantProfile;
        $job = $profile ? JobPost::where('merchant_profile_id', $profile->id)->where('title', 'Barista Paruh Waktu')->first() : null;

        if (!$merchant || !$job) {
            $this->command?->warn('Akun merchant / lowongan demo belum ada. Jalankan DatabaseSeeder dulu.');

            return;
        }

        // 1) Budi Santoso — lamaran menunggu review
        $budi = User::where('email', 'mahasiswa@paruhkita.test')->firstOrFail();
        $this->ensureAvailability($budi);
        $pending = $this->makeApplication($budi, $job, 'pending', '2026-11-09 02:41:00');
        $this->storeDocuments($pending, 'Budi_Santoso', true);
        $this->writeHistories($pending, '2026-11-09 02:41:00', $profile->merchant_name, [
            ['submitted', 'Formulir dan dokumen berhasil dikirim.', '2026-11-09 02:41:00'],
            ['received', 'Lamaran tercatat dan diteruskan ke ' . $profile->merchant_name . '.', '2026-11-09 02:42:00'],
            ['pending', 'Masuk antrean peninjauan merchant.', '2026-11-09 02:42:00'],
        ]);

        // 2) Raka Pratama — ditolak + dokumen masukan
        $raka = User::firstOrCreate(
            ['email' => 'raka@paruhkita.test'],
            ['name' => 'Raka Pratama', 'password' => Hash::make('password123'), 'role' => 'mahasiswa', 'phone' => '081234567890']
        );
        $raka->studentProfile()->firstOrCreate(['user_id' => $raka->id], [
            'university' => 'Universitas Gadjah Mada',
            'major' => 'Informatika',
            'degree_level' => 'S1',
            'is_currently_studying' => true,
            'gpa' => 3.6,
        ]);
        $this->ensureAvailability($raka);

        $rejected = $this->makeApplication($raka, $job, 'rejected', '2026-11-09 02:41:00', 'Mohon maaf, lamaran kamu belum berhasil. Merchant memilih kandidat lain yang dinilai lebih sesuai dengan kebutuhan posisi ' . $job->title . '.');
        $this->storeDocuments($rejected, 'Raka_Pratama', true);
        $this->writeHistories($rejected, '2026-11-09 02:41:00', $profile->merchant_name, [
            ['submitted', 'Formulir dan dokumen berhasil dikirim.', '2026-11-09 02:41:00'],
            ['received', 'Lamaran tercatat dan diteruskan ke ' . $profile->merchant_name . '.', '2026-11-09 02:42:00'],
            ['pending', 'Masuk antrean peninjauan merchant.', '2026-11-09 02:42:00'],
            ['reviewing', 'Dokumen lamaran ditinjau oleh ' . $profile->merchant_name . '.', '2026-11-10 03:12:00'],
            ['interview', 'Biodata dan dokumen sesuai persyaratan posisi.', '2026-11-11 07:05:00'],
            ['rejected', 'Lamaran belum berhasil. Lihat rekomendasi perbaikan dari merchant.', '2026-11-13 02:15:00'],
        ]);
        DB::table('job_applications')->where('id', $rejected->id)->update(['updated_at' => '2026-11-13 02:15:00']);

        $schedule = InterviewSchedule::firstOrCreate(
            ['job_application_id' => $rejected->id, 'scheduled_date' => '2026-11-12'],
            [
                'merchant_profile_id' => $profile->id,
                'job_post_id' => $job->id,
                'user_id' => $raka->id,
                'interview_type' => 'online',
                'start_time' => '09:00',
                'end_time' => '09:45',
                'location' => 'https://meet.google.com/wawancara/',
                'status' => 'selesai',
                'availability_label' => 'Rabu, 09.00 – 17.00',
            ]
        );
        $schedule->update(['status' => 'selesai']);

        ApplicationFeedbackReport::updateOrCreate(
            ['job_application_id' => $rejected->id],
            [
                'cv_score' => 3,
                'portfolio_score' => 2,
                'skills_score' => 3,
                'cv_note' => 'CV sudah memuat pendidikan dan pengalaman. Tambahkan hasil kerja nyata, terukur serta rapikan urutan informasi agar lebih mudah dibaca.',
                'portfolio_note' => 'Portofolio belum menunjukkan proses kerja secara lengkap. Sertakan 2–3 proyek yang relevan beserta peran, proses, dan hasilnya.',
                'skills_note' => 'Dasar pelayanan pelanggan sudah cukup baik. Tingkatkan pengetahuan menu kopi dan latihan alur pelayanan saat jam sibuk.',
                'recommendations' => [
                    'Perbaiki CV dengan contoh pencapaian dan tanggung jawab yang jelas.',
                    'Lengkapi portofolio dengan 2–3 contoh pekerjaan yang relevan.',
                    'Latih pengenalan menu kopi dan simulasi pelayanan pelanggan.',
                    'Gunakan evaluasi ini sebagai panduan sebelum mengikuti rekrutmen berikutnya.',
                ],
                'status' => 'final',
                'decided_at' => '2026-11-13 02:15:00',
            ]
        );

        // 3) Dewi Lestari — diterima
        $dewi = User::firstOrCreate(
            ['email' => 'dewi@paruhkita.test'],
            ['name' => 'Dewi Lestari', 'password' => Hash::make('password123'), 'role' => 'mahasiswa', 'phone' => '081298765432']
        );
        $dewi->studentProfile()->firstOrCreate(['user_id' => $dewi->id], [
            'university' => 'Universitas Gadjah Mada',
            'major' => 'Manajemen',
            'degree_level' => 'S1',
            'is_currently_studying' => true,
            'gpa' => 3.78,
        ]);
        $this->ensureAvailability($dewi);

        $accepted = $this->makeApplication($dewi, $job, 'accepted', '2026-11-09 02:41:00');
        $this->storeDocuments($accepted, 'Dewi_Lestari', true);
        $this->writeHistories($accepted, '2026-11-09 02:41:00', $profile->merchant_name, [
            ['submitted', 'Formulir dan dokumen berhasil dikirim.', '2026-11-09 02:41:00'],
            ['received', 'Lamaran tercatat dan diteruskan ke ' . $profile->merchant_name . '.', '2026-11-09 02:42:00'],
            ['pending', 'Masuk antrean peninjauan merchant.', '2026-11-09 02:42:00'],
            ['reviewing', 'Dokumen lamaran ditinjau oleh ' . $profile->merchant_name . '.', '2026-11-10 03:12:00'],
            ['interview', 'Biodata dan dokumen sesuai persyaratan posisi.', '2026-11-11 07:05:00'],
            ['accepted', 'Selamat! Kamu diterima sebagai ' . $job->title . ' di ' . $profile->merchant_name . '.', '2026-11-13 02:15:00'],
        ]);
        DB::table('job_applications')->where('id', $accepted->id)->update(['updated_at' => '2026-11-13 02:15:00']);

        InterviewSchedule::firstOrCreate(
            ['job_application_id' => $accepted->id, 'scheduled_date' => '2026-11-12'],
            [
                'merchant_profile_id' => $profile->id,
                'job_post_id' => $job->id,
                'user_id' => $dewi->id,
                'interview_type' => 'online',
                'start_time' => '09:00',
                'end_time' => '09:45',
                'location' => 'https://meet.google.com/wawancara/',
                'status' => 'selesai',
                'availability_label' => 'Rabu, 09.00 – 17.00',
            ]
        );

        $this->command?->info('Seeder flow kandidat selesai: 1 menunggu review, 1 diterima, 1 ditolak + feedback report.');
    }

    private function makeApplication(User $student, JobPost $job, string $status, string $createdAt, ?string $note = null): JobApplication
    {
        $application = JobApplication::firstOrCreate(
            ['job_post_id' => $job->id, 'user_id' => $student->id],
            ['status' => $status, 'motivation' => 'Saya ingin mengembangkan kemampuan pelayanan dan mendapatkan pengalaman kerja paruh waktu yang relevan.', 'merchant_note' => $note]
        );

        $application->update(['status' => $status, 'merchant_note' => $note]);
        DB::table('job_applications')->where('id', $application->id)->update([
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);

        return $application->fresh();
    }

    private function writeHistories(JobApplication $application, string $start, string $merchantName, array $rows): void
    {
        DB::table('job_application_status_histories')->where('job_application_id', $application->id)->delete();

        foreach ($rows as [$status, $note, $at]) {
            DB::table('job_application_status_histories')->insert([
                'job_application_id' => $application->id,
                'status' => $status,
                'note' => $note,
                'created_at' => $at,
                'updated_at' => $at,
            ]);
        }
    }

    private function storeDocuments(JobApplication $application, string $slug, bool $withPortfolio): void
    {
        $documents = [
            ['cv', "CV_{$slug}.pdf", 1258291],
            ['student_id', "KTM_{$slug}.pdf", 838861],
        ];

        if ($withPortfolio) {
            $documents[] = ['portfolio', "Portofolio_{$slug}.pdf", 2516582];
        }

        foreach ($documents as [$type, $name, $size]) {
            $path = 'application-documents/' . $application->id . '-' . $type . '.pdf';
            $header = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n";
            Storage::disk('local')->put($path, $header . str_repeat(' ', max(0, $size - strlen($header))));

            $application->documents()->updateOrCreate(
                ['document_type' => $type],
                [
                    'original_name' => $name,
                    'file_path' => $path,
                    'mime_type' => 'application/pdf',
                    'file_size' => $size,
                ]
            );
        }
    }

    private function ensureAvailability(User $student): void
    {
        if ($student->studentAvailabilities()->count() > 0) {
            return;
        }

        foreach ([
            ['day_of_week' => 'Senin', 'start_time' => '16:00', 'end_time' => '20:00'],
            ['day_of_week' => 'Rabu', 'start_time' => '16:00', 'end_time' => '20:00'],
            ['day_of_week' => 'Jumat', 'start_time' => '16:00', 'end_time' => '20:00'],
        ] as $availability) {
            StudentAvailability::create($availability + [
                'user_id' => $student->id,
                'hours_per_day' => 4,
            ]);
        }
    }
}
