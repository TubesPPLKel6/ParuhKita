<?php

namespace Database\Seeders;

use App\Models\MerchantProfile;
use App\Models\MerchantVerificationDocument;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class VerificationDemoSeeder extends Seeder
{
    private const STATUSES = ['not_submitted', 'pending', 'approved', 'revision_required', 'rejected'];

    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@paruhkita.test'],
            ['name' => 'Admin ParuhKita', 'password' => Hash::make('password123'), 'role' => 'admin']
        );

        $this->seedStudents($admin);
        $this->seedMerchants($admin);

        $this->command?->info('Demo verification data created for all statuses.');
    }

    private function seedStudents(User $admin): void
    {
        foreach (self::STATUSES as $status) {
            $key = str_replace('_', '-', $status);
            $user = User::updateOrCreate(
                ['email' => "audit.student.{$key}@paruhkita.test"],
                ['name' => 'Audit Mahasiswa ' . $status, 'password' => Hash::make('password123'), 'role' => 'mahasiswa']
            );

            $path = $status === 'not_submitted' ? null : "student-verification/demo-{$key}/ktm-{$key}.pdf";
            if ($path) {
                Storage::disk('local')->put($path, $this->pdfContent('KTM Audit Mahasiswa ' . $status));
            }

            StudentProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'university' => 'Universitas Audit Indonesia',
                    'faculty' => 'Teknologi Informasi',
                    'major' => 'Sistem Informasi',
                    'nim' => $status === 'not_submitted' ? null : 'AUD-' . strtoupper(substr($key, 0, 4)),
                    'ktm_file_path' => $path,
                    'is_verified' => $status === 'approved',
                    'verification_status' => $status,
                    'verification_submitted_at' => $status === 'not_submitted' ? null : now()->subDays(array_search($status, self::STATUSES, true) + 1),
                    'verified_at' => $status === 'approved' ? now()->subDay() : null,
                    'verified_by_user_id' => $status === 'not_submitted' ? null : $admin->id,
                    'verification_note' => $this->noteFor($status, 'mahasiswa'),
                ]
            );
        }
    }

    private function seedMerchants(User $admin): void
    {
        $documentTypes = ['ktp', 'nib', 'business_license', 'store_photo', 'npwp'];
        foreach (self::STATUSES as $status) {
            $key = str_replace('_', '-', $status);
            $user = User::updateOrCreate(
                ['email' => "audit.merchant.{$key}@paruhkita.test"],
                ['name' => 'Audit Merchant ' . $status, 'password' => Hash::make('password123'), 'role' => 'merchant']
            );

            $profile = MerchantProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'merchant_name' => 'Audit Merchant ' . $status,
                    'category' => 'Merchant Demo & F&B',
                    'address' => 'Jl. Pengujian Lokal No. 8',
                    'is_verified' => $status === 'approved',
                    'verification_status' => $status,
                    'verification_submitted_at' => $status === 'not_submitted' ? null : now()->subDays(array_search($status, self::STATUSES, true) + 1),
                    'verified_at' => $status === 'approved' ? now()->subDay() : null,
                    'verified_by_user_id' => $status === 'not_submitted' ? null : $admin->id,
                    'verification_note' => $this->noteFor($status, 'merchant'),
                ]
            );

            $profile->verificationDocuments()->delete();
            if ($status === 'not_submitted') {
                continue;
            }

            foreach ($documentTypes as $documentType) {
                $extension = $documentType === 'store_photo' ? 'png' : 'pdf';
                $path = "merchant-verification/demo-{$key}/{$documentType}.{$extension}";
                Storage::disk('local')->put($path, $extension === 'png' ? $this->pngContent() : $this->pdfContent(strtoupper($documentType) . ' Audit Merchant ' . $status));
                MerchantVerificationDocument::create([
                    'merchant_profile_id' => $profile->id,
                    'document_type' => $documentType,
                    'file_path' => $path,
                    'original_name' => strtoupper($documentType) . "_audit_{$key}.{$extension}",
                ]);
            }
        }
    }

    private function noteFor(string $status, string $type): ?string
    {
        return match ($status) {
            'revision_required' => $type === 'mahasiswa'
                ? 'Foto KTM buram pada bagian masa berlaku. Harap unggah ulang dokumen yang lebih jelas.'
                : 'Foto outlet belum menampilkan papan nama usaha. Harap unggah foto terbaru.',
            'rejected' => $type === 'mahasiswa'
                ? 'Data NIM demo tidak dapat diverifikasi sebagai mahasiswa aktif.'
                : 'Dokumen legalitas demo tidak memenuhi persyaratan verifikasi.',
            default => null,
        };
    }

    private function pdfContent(string $title): string
    {
        $text = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $title);
        return "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length " . (46 + strlen($text)) . ">>stream\nBT /F1 18 Tf 72 720 Td ({$text}) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF";
    }

    private function pngContent(): string
    {
        return base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
    }
}
