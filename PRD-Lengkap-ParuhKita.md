# Product Requirement Document (PRD) & Spesifikasi Teknis Lengkap
## Platform ParuhKita — Portal Kerja Paruh Waktu Mahasiswa Indonesia

---

## 1. Executive Summary & Visi Produk

**ParuhKita** adalah platform ketenagakerjaan paruh waktu (*part-time job marketplace*) berbasis web yang dirancang khusus untuk mahasiswa di seluruh perguruan tinggi di Indonesia. Masalah mendasar yang dipecahkan:
1. **Pencegahan Bentrok Kuliah:** Mahasiswa sering kesulitan mencari pekerjaan paruh waktu yang fleksibel dan sesuai jam kosong kuliah masing-masing kampus.
2. **Standardisasi Kelayakan Kerja Mahasiswa:** Memastikan pekerjaan memiliki jam kerja wajar (maks 4 jam/shift), upah layak per jam, lokasi terjangkau (< 3-5 km dari kampus), dan transparansi tugas tanpa eksploitasi di berbagai kota di Indonesia.
3. **Kesiapan Karier Terverifikasi:** Verifikasi identitas Kartu Tanda Mahasiswa (KTM), kurasi CV, portofolio karya, dan sertifikasi keahlian sebelum melamar ke merchant lokal.
4. **Dampak Pembangunan Berkelanjutan (SDG 8):** Mendorong pertumbuhan ekonomi yang inklusif dan pekerjaan layak bagi generasi muda Indonesia.

---

## 2. Tech Stack & Tools Spesifik (Daftar Lengkap & Versi)

Berikut adalah daftar **teknologi, framework, runtime, dan tools spesifik** yang digunakan dalam proyek ini untuk dibagikan ke seluruh anggota tim:

### 2.1 Backend Stack (API Service)
* **Framework:** Laravel `12.12.2` (PHP Framework modern)
* **PHP Runtime:** PHP `8.3.30` (VS16 x64) melalui Laragon
* **Database Engine:** MySQL `8.0` / MariaDB (Port: `3306`, Default DB: `paruhkita_db`)
* **Autentikasi:** Laravel Sanctum `^4.3` (Stateful Token-based Bearer Authentication)
* **Database Driver / ORM:** Eloquent ORM + PDO MySQL
* **Package Manager:** Composer `2.x`
* **File Storage:** Local Disk Storage (`storage/app/public` disimbolkan ke `public/storage`)
* **Dev Server Backend:** `php artisan serve --host=127.0.0.1 --port=8000`

### 2.2 Frontend Stack (Single Page Application)
* **Build Tool & Bundler:** Vite `8.3.5` (Ultra-fast HMR)
* **JavaScript Library:** React `19.3.1` (Functional Components & Hooks)
* **DOM Renderer:** React DOM `19.3.1`
* **Client-side Routing:** React Router DOM `^7.18.5` (`BrowserRouter`, `Routes`, `Route`, `Navigate`)
* **CSS Framework:** Tailwind CSS `^4.3.3` (Engine v4)
* **Vite CSS Plugin:** `@tailwindcss/vite`
* **HTTP Client:** Axios `^1.21.0` (dikonfigurasi dengan Axios Interceptor untuk otomatis menyisipkan header `Authorization: Bearer <token>`)
* **Icon Pack:** Lucide React `^1.66.0` (Icon modern berbasis SVG)
* **State Management:** React Context API (`AuthContext`)
* **Node.js Environment:** Node.js `v22.17.0` (LTS) & npm `10.9.2`
* **Dev Server Frontend:** `npm run dev` (`http://localhost:5173`)

### 2.3 Lingkungan Pengembangan & Tools Tim (Developer Environment)
* **All-in-One Local Server:** **Laragon** (Windows)
  * MySQL service aktif pada port 3306
  * PHP 8.3 CLI bawaan Laragon
  * Database GUI: HeidiSQL (bawaan Laragon) atau phpMyAdmin
* **API Testing Tool:** Postman / Insomnia / Thunder Client (VS Code Extension)
* **Code Editor:** Visual Studio Code / Antigravity IDE
* **Version Control:** Git & GitHub (Branching strategy per PBI/PIC)

---

## 3. Design System & Style Tokens (Sesuai Figma)

Platform ParuhKita menggunakan **tema warna terang (Light Theme Only)** dengan palet 10 warna heksadesimal resmi:

| Token Name | Hex Code | Penggunaan di UI |
| :--- | :--- | :--- |
| **`pk-navy`** | `#03045E` | Header Navbar, Hero Banner, Card KTM Digital, Footer background |
| **`pk-primary`**| `#023E8A` | Heading H1/H2, Subtitle dokumen, Tombol Primer |
| **`pk-body`**   | `#102C4D` | Teks body utama, label input, judul kartu lowongan |
| **`pk-cyan`**   | `#00B4D8` | Aksen tombol aktif, tab terpilih, progress bar, badge "KTM terverifikasi" |
| **`pk-pastel`** | `#CAF0F8` | Background badge, highlight jadwal, container info ringan |
| **`pk-muted`**  | `#536B82` | Teks sekunder, deskripsi bantuan, timestamp ulasan |
| **`pk-border`** | `#D8E5EE` | Garis batas (*border*) kartu, input outline, divider |
| **`pk-canvas`** | `#F6F9FC` | Background halaman (*off-white* lembut) |
| **`pk-white`**  | `#FFFFFF` | Background kartu, modal dialog, formulir |
| **`pk-amber`**  | `#F59E0B` | Tombol CTA utama (*"Lamar Sekarang"*, *"Perbarui CV"*, *"Mulai Latihan"*) |
| **`pk-gold`**   | `#FBB02D` | Bintang rating ulasan, badge upah kerja |

* **Tipografi:** `Plus Jakarta Sans` (Heading & Display) dan `Inter` (Body & Interface).
* **Radius Sudut:** Card besar `rounded-2xl` (16px), Button/Input `rounded-xl` (12px), Badge `rounded-full` (9999px).

---

## 4. Pembagian Tugas 28 PBI untuk 7 Anggota Tim

| PIC | Sprint 1 (Fondasi & Transaksi Awal) | Sprint 2 (Monitoring, Pengayaan & Analitik) |
| :--- | :--- | :--- |
| **Orang 1** | **PBI-01:** CRUD Lowongan Part-Time, Kuota & Tenggat<br>**PBI-02:** Pengelolaan Pelamar & Keputusan Rekrutmen | **PBI-15:** Dashboard & Statistik Lowongan Merchant<br>**PBI-16:** Feedback CV & Portofolio Pelamar Ditolak |
| **Orang 2** *(Scope Kita)* | **PBI-03:** Pengelolaan Profil, CV, Portofolio & Jadwal Kuliah<br>**PBI-04:** Bookmark & Pengingat Tenggat Lowongan | **PBI-17:** Dashboard Mahasiswa & Ringkasan Aktivitas<br>**PBI-18:** Perbandingan Lowongan Part-Time (*Side-by-side*) |
| **Orang 3** | **PBI-05:** CRUD Profil Mitra/Perusahaan & Fasilitas Kerja<br>**PBI-06:** Verifikasi Identitas KTM & Legalitas Usaha | **PBI-19:** Pencarian Kandidat Berdasarkan Kriteria & Filter<br>**PBI-20:** Pusat Edukasi & Course Kesiapan Kerja Mahasiswa |
| **Orang 4** | **PBI-07:** Pengajuan Lamaran Kerja Mahasiswa<br>**PBI-08:** Pelacakan Status Lamaran Kerja (*Tracking Status*) | **PBI-21:** Penjadwalan Wawancara, Trial Shift & Feedback<br>**PBI-22:** Rating & Catatan Kinerja Mahasiswa Pasca-Kerja |
| **Orang 5** | **PBI-09:** Pusat Pengaduan & Pelaporan Pelanggaran Kerja<br>**PBI-10:** Survei Evaluasi Kelayakan Tempat Kerja | **PBI-23:** Moderasi Pengaduan, Pelanggaran & Konten<br>**PBI-24:** Ruang Komunitas & Forum Diskusi Mahasiswa |
| **Orang 6** | **PBI-11:** CRUD Master Data Kampus, Prodi & Kategori<br>**PBI-12:** Manajemen Hak Akses (Role-based) & Status Akun | **PBI-25:** Ekspor Laporan Audit & Data Log Sistem<br>**PBI-26:** Dashboard Admin & Analitik Dampak Ekonomi SDG 8 |
| **Orang 7** | **PBI-13:** Notifikasi Aktivitas Platform (Multi-channel)<br>**PBI-14:** Pencarian & Filter Lowongan Part-Time | **PBI-27:** Pesan & Interaksi Chat Antarmahasiswa<br>**PBI-28:** Badge Status & Pencapaian Mahasiswa (*Gamification*) |

---

## 5. Struktur Folder Repositori Bersama

```
ParuhKita/
├── paruhkita-api/               # Backend Laravel 12 REST API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/ # Auth, Profile, CV, Portfolio, Job, Application, dll.
│   │   │   ├── Middleware/      # HandleCors, Authenticate, RoleMiddleware
│   │   │   ├── Requests/        # Form Validation Requests
│   │   │   └── Resources/       # API JSON Transformer
│   │   └── Models/              # User, StudentProfile, StudentCv, Job, dll.
│   ├── database/
│   │   ├── migrations/          # Schema Database Migrations
│   │   └── seeders/             # DatabaseSeeder (Akun Mahasiswa, Merchant, Admin)
│   ├── routes/
│   │   └── api.php              # Definisi Endpoint API RESTful
│   └── config/
│       ├── cors.php             # Whitelist Frontend URL (localhost:5173)
│       └── filesystems.php      # Konfigurasi Storage Publik
│
├── paruhkita-fe/                # Frontend React 19 + Vite SPA
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js         # Konfigurasi Axios BaseURL & Token Interceptor
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Global Auth State (User, Token, Login, Logout)
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Header Sticky dengan Dropdown 3 Pengelolaan
│   │   │   ├── Footer.jsx       # Footer Resmi ParuhKita
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── KesiapanKarier.jsx # Halaman Utama Mahasiswa (Sesuai Figma)
│   │   │   ├── CariLowongan.jsx   # Pencarian & Filter Shift Mahasiswa
│   │   │   ├── Komunitas.jsx      # Forum Diskusi & Ulasan Tempat Kerja
│   │   │   ├── Profile.jsx        # Pengelolaan Profil (Biodata, Jadwal, Skill)
│   │   │   ├── CvList.jsx         # Pengelolaan CV (Upload PDF, Builder, Primary)
│   │   │   ├── PortfolioList.jsx  # Pengelolaan Portofolio & Sertifikat
│   │   │   └── Login.jsx          # Autentikasi Pengguna
│   │   ├── App.jsx              # Routing Provider
│   │   └── index.css            # Tailwind CSS v4 Theme Tokens
│   └── vite.config.js
└── PRD-Lengkap-ParuhKita.md     # Dokumentasi Spesifikasi Resmi Tim
```

---

## 6. Standar API Contract (JSON Standard)

Seluruh response API wajib mengikuti standar format JSON konsisten:

### Response Sukses:
```json
{
  "status": true,
  "message": "Operasi berhasil",
  "data": { ... }
}
```

### Response Gagal / Validasi:
```json
{
  "status": false,
  "message": "Pesan kesalahan atau validasi tidak lolos",
  "errors": {
    "field_name": ["Detail pesan kesalahan"]
  }
}
```

### Header Wajib:
* `Accept: application/json`
* `Authorization: Bearer <token_sanctum>` (untuk endpoint private)
