<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Akun mahasiswa untuk testing
        $mahasiswa = User::firstOrCreate(
            ['email' => 'mahasiswa@paruhkita.test'],
            [
                'name'     => 'Budi Santoso',
                'password' => Hash::make('password123'),
                'role'     => 'mahasiswa',
            ]
        );

        // Buat profil awal
        $mahasiswa->studentProfile()->firstOrCreate(
            ['user_id' => $mahasiswa->id],
            [
                'phone'           => '081234567890',
                'bio'             => 'Mahasiswa aktif mencari pengalaman kerja paruh waktu.',
                'university'      => 'Universitas Gadjah Mada',
                'faculty'         => 'Teknik',
                'major'           => 'Informatika',
                'graduation_year' => 2026,
                'gpa'             => 3.75,
                'linkedin_url'    => 'https://linkedin.com/in/budisantoso',
                'experiences'     => [
                    [
                        'id' => 1,
                        'role' => 'Crew Kasir & Pelayanan',
                        'company' => 'Roti Pagi Store',
                        'period' => 'Juni 2026 - Agustus 2026',
                        'description' => 'Melayani transaksi kasir POS, merapikan display produk toko, dan menyambut lebih dari 80 pelanggan per shift.'
                    ],
                    [
                        'id' => 2,
                        'role' => 'Staff Humas & Media',
                        'company' => 'Himpunan Mahasiswa Informatika',
                        'period' => 'Januari 2025 - Desember 2025',
                        'description' => 'Mengelola publikasi media sosial kegiatan seminar dan menjalin komunikasi kemitraan dengan sponsor kampus.'
                    ]
                ],
                'portfolio_projects' => [
                    [
                        'id' => 1,
                        'title' => 'Sistem Pemesanan Menu Kasir Kafe (POS Web)',
                        'category' => 'Aplikasi Web & UI Design',
                        'period' => 'April 2026',
                        'description' => 'Membuat antarmuka responsif untuk kasir kafe menggunakan React dan Tailwind CSS untuk mempercepat proses pencatatan shift.',
                        'project_url' => 'https://github.com/budisantoso/pos-cafe'
                    ],
                    [
                        'id' => 2,
                        'title' => 'Desain Identitas Visual & Brosur Promosi UMKM',
                        'category' => 'Desain Grafis & Branding',
                        'period' => 'Maret 2026',
                        'description' => 'Merancang flyer promosi dan aset digital Instagram story untuk meningkatkan penjualan toko ritel lokal.',
                        'project_url' => 'https://figma.com/@budisantoso/umkm-branding'
                    ]
                ]
            ]
        );

        // Skills awal
        $skills = ['Laravel', 'React.js', 'MySQL', 'Figma'];
        foreach ($skills as $skill) {
            $mahasiswa->studentSkills()->firstOrCreate(['skill_name' => $skill]);
        }

        // Akun merchant untuk testing
        User::firstOrCreate(
            ['email' => 'merchant@paruhkita.test'],
            [
                'name'     => 'Warung Bu Dewi',
                'password' => Hash::make('password123'),
                'role'     => 'merchant',
            ]
        );

        // Akun admin untuk testing
        User::firstOrCreate(
            ['email' => 'admin@paruhkita.test'],
            [
                'name'     => 'Admin ParuhKita',
                'password' => Hash::make('password123'),
                'role'     => 'admin',
            ]
        );

        $this->command->info('Seeder selesai! Akun testing:');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Mahasiswa', 'mahasiswa@paruhkita.test', 'password123'],
                ['Merchant',  'merchant@paruhkita.test',  'password123'],
                ['Admin',     'admin@paruhkita.test',     'password123'],
            ]
        );
    }
}
