<?php

namespace Database\Seeders;

use App\Models\Campus;
use App\Models\JobCategory;
use App\Models\JobPost;
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
        $merchant = User::firstOrCreate(
            ['email' => 'merchant@paruhkita.test'],
            [
                'name'     => 'Warung Bu Dewi',
                'password' => Hash::make('password123'),
                'role'     => 'merchant',
            ]
        );
        $merchantProfile = $merchant->merchantProfile()->firstOrCreate(
            ['user_id' => $merchant->id],
            [
                'merchant_name' => $merchant->name,
                'category' => 'Makanan & Minuman',
                'description' => 'Warung makan rumahan dengan menu harian dan layanan ramah.',
                'phone' => $merchant->phone ?: '081234567891',
                'address' => 'Jl. Kaliurang, Yogyakarta',
                'is_verified' => true,
                'verification_status' => 'approved',
            ]
        );
        $merchantProfile->fill([
            'merchant_name' => $merchantProfile->merchant_name ?: $merchant->name,
            'category' => $merchantProfile->category ?: 'Makanan & Minuman',
            'description' => $merchantProfile->description ?: 'Warung makan rumahan dengan menu harian dan layanan ramah.',
            'phone' => $merchantProfile->phone ?: ($merchant->phone ?: '081234567891'),
            'address' => $merchantProfile->address ?: 'Jl. Kaliurang, Yogyakarta',
        ])->save();
        foreach ([
            ['name' => 'Area makan', 'category' => 'dining', 'description' => 'Area nyaman untuk makan dan beristirahat.'],
            ['name' => 'Tempat ibadah', 'category' => 'worship', 'description' => 'Ruang ibadah tersedia di dekat tempat kerja.'],
        ] as $facility) {
            $merchantProfile->facilities()->firstOrCreate(
                ['name' => $facility['name']],
                ['category' => $facility['category'], 'description' => $facility['description']]
            );
        }

        $campuses = [];
        foreach ([
            ['name' => 'Universitas Gadjah Mada', 'code' => 'UGM', 'city' => 'Yogyakarta', 'accreditation' => 'Unggul'],
            ['name' => 'Universitas Indonesia', 'code' => 'UI', 'city' => 'Depok', 'accreditation' => 'Unggul'],
            ['name' => 'Institut Teknologi Bandung', 'code' => 'ITB', 'city' => 'Bandung', 'accreditation' => 'Unggul'],
        ] as $campusData) {
            $campuses[$campusData['code']] = Campus::firstOrCreate(
                ['name' => $campusData['name']],
                $campusData + ['status' => 'active']
            );
        }

        foreach ([
            ['campus' => 'UGM', 'name' => 'Informatika', 'code' => 'UGM-IF', 'degree_level' => 'S1'],
            ['campus' => 'UGM', 'name' => 'Manajemen', 'code' => 'UGM-MNJ', 'degree_level' => 'S1'],
            ['campus' => 'UI', 'name' => 'Ilmu Komputer', 'code' => 'UI-IK', 'degree_level' => 'S1'],
            ['campus' => 'ITB', 'name' => 'Sistem dan Teknologi Informasi', 'code' => 'ITB-STI', 'degree_level' => 'S1'],
        ] as $program) {
            $campus = $campuses[$program['campus']];
            $campus->studyPrograms()->firstOrCreate(
                ['name' => $program['name']],
                [
                    'code' => $program['code'],
                    'degree_level' => $program['degree_level'],
                    'status' => 'active',
                ]
            );
        }

        foreach ([
            'Food & Beverage' => [
                'description' => 'Pekerjaan di bidang makanan, minuman, dan layanan restoran.',
                'subcategories' => ['Barista', 'Koki', 'Pramusaji'],
            ],
            'Retail' => [
                'description' => 'Pekerjaan di bidang toko, penjualan, dan layanan pelanggan.',
                'subcategories' => ['Kasir', 'Pramuniaga', 'Penata Barang'],
            ],
            'Pendidikan' => [
                'description' => 'Pekerjaan mengajar, membimbing, dan mendukung kegiatan belajar.',
                'subcategories' => ['Tutor', 'Asisten Pengajar'],
            ],
            'Administrasi' => [
                'description' => 'Pekerjaan pengelolaan dokumen dan dukungan operasional kantor.',
                'subcategories' => ['Staf Administrasi', 'Entri Data'],
            ],
            'Kreatif & Digital' => [
                'description' => 'Pekerjaan di bidang konten, desain, dan pemasaran digital.',
                'subcategories' => ['Desain Grafis', 'Admin Media Sosial', 'Penulis Konten'],
            ],
        ] as $categoryName => $categoryData) {
            $category = JobCategory::firstOrCreate(
                ['name' => $categoryName],
                ['description' => $categoryData['description'], 'status' => 'active']
            );
            foreach ($categoryData['subcategories'] as $subcategoryName) {
                $category->subcategories()->firstOrCreate(['name' => $subcategoryName]);
            }
        }

        foreach ([
            [
                'title' => 'Barista Paruh Waktu',
                'category' => 'Food & Beverage',
                'subcategory' => 'Barista',
                'schedule' => 'Senin, Rabu, Jumat · 16.00–20.00',
                'wage' => 'Rp25.000/jam',
                'quota' => '2 orang',
                'description' => 'Menyiapkan minuman, melayani pelanggan, dan menjaga kebersihan area kerja.',
            ],
            [
                'title' => 'Pramusaji Akhir Pekan',
                'category' => 'Food & Beverage',
                'subcategory' => 'Pramusaji',
                'schedule' => 'Sabtu-Minggu · 08.00–13.00',
                'wage' => 'Rp23.000/jam',
                'quota' => '2 orang',
                'description' => 'Membantu pelayanan pelanggan dan menyiapkan area makan.',
            ],
        ] as $jobData) {
            $merchantProfile->jobPosts()->firstOrCreate(
                ['title' => $jobData['title']],
                $jobData + ['status' => 'active']
            );
        }

        // Akun admin untuk testing
        User::firstOrCreate(
            ['email' => 'admin@paruhkita.test'],
            [
                'name'     => 'Admin ParuhKita',
                'password' => Hash::make('password123'),
                'role'     => 'admin',
            ]
        );

        if ($this->command && app()->environment('local')) {
            $this->call(VerificationDemoSeeder::class);
        }

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
