# PRD — TUB-3: Pengelolaan Profil, CV, Portofolio & Dashboard Mahasiswa
**Platform:** ParuhKita | **Sprint:** 1 | **Jira Ticket:** TUB-3  
**Assignee:** Muhammad Falih Al-Musyaffa (MM)  
**Stack:** Laravel 11 (Backend API) · React.js (Frontend) · MySQL · Context API

---

## 1. Overview & Scope

TUB-3 mencakup **2 halaman utama** dan **1 fitur CV builder**:

| Route | Halaman | Deskripsi |
|-------|---------|-----------|
| `/dashboard` | Dashboard Mahasiswa | Ringkasan aktivitas, lamaran, jadwal, rekomendasi |
| `/profil` | Profil & Pengaturan | Edit data diri, keterampilan, ketersediaan, sosial |
| `/profil/cv` | CV & Portofolio | Upload/build CV, upload portfolio, kelola versi |

**Out of Scope TUB-3** (dikerjakan di TUB lain):
- Logic izin akses merchant ke profil (TUB-4)
- Sistem lamaran (TUB-5)
- Rekomendasi lowongan berbasis AI (TUB-6)
- Badge otomatis dari sistem (TUB-14)
- Rating dari merchant (TUB-10)

---

## 2. User Stories

### 2.1 Dashboard Mahasiswa
```
US-01  Sebagai mahasiswa, saya ingin melihat ringkasan status lamaran saya
       (total, pending, diterima, ditolak) agar tahu progres rekrutmen saya.

US-02  Sebagai mahasiswa, saya ingin melihat jadwal wawancara/trial shift
       terdekat agar tidak melewatkan jadwal seleksi.

US-03  Sebagai mahasiswa, saya ingin melihat rekomendasi lowongan berdasarkan
       profil saya agar mudah menemukan pekerjaan yang sesuai.

US-04  Sebagai mahasiswa, saya ingin melihat badge dan pencapaian saya
       agar termotivasi mengembangkan karier.

US-05  Sebagai mahasiswa, saya ingin melihat rating kinerja saya dari merchant
       agar tahu reputasi profesional saya.

US-06  Sebagai mahasiswa, saya ingin melihat progress kursus yang sedang
       saya ikuti agar dapat melanjutkan pembelajaran.
```

### 2.2 Profil Mahasiswa
```
US-07  Sebagai mahasiswa, saya ingin mengupload dan mengubah foto profil
       agar terlihat profesional.

US-08  Sebagai mahasiswa, saya ingin mengisi dan memperbarui data diri
       (nama, kampus, prodi, angkatan, no. HP, bio) agar profil saya lengkap.

US-09  Sebagai mahasiswa, saya ingin menambahkan tag keterampilan (free-text)
       agar merchant bisa menilai keahlian saya.

US-10  Sebagai mahasiswa, saya ingin mengatur ketersediaan waktu kerja
       (hari + jam mulai-selesai) agar merchant tahu kapan saya bisa bekerja.

US-11  Sebagai mahasiswa, saya ingin menambahkan link sosial (LinkedIn,
       GitHub, Instagram) agar merchant bisa melihat profil online saya.
```

### 2.3 CV & Portofolio
```
US-12  Sebagai mahasiswa, saya ingin mengupload CV dalam format PDF
       (maks 10 MB) agar merchant dapat mengunduhnya.

US-13  Sebagai mahasiswa, saya ingin membuat CV langsung dari form
       (pengalaman, pendidikan, keterampilan) agar tidak perlu file eksternal.

US-14  Sebagai mahasiswa, saya ingin menyimpan lebih dari 1 versi CV
       (misal: "CV Barista", "CV Kasir") agar bisa melamar berbagai jenis kerja.

US-15  Sebagai mahasiswa, saya ingin mengupload file portofolio
       (gambar/PDF, maks 10 MB per file) untuk menampilkan karya saya.

US-16  Sebagai mahasiswa, saya ingin memberi judul dan deskripsi pada
       setiap item portofolio agar merchant memahami konteks karya.
```

---

## 3. Skema Database (MySQL)

### 3.1 Tabel Utama

```sql
-- Tabel users (sudah ada dari auth)
CREATE TABLE users (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password      VARCHAR(255) NOT NULL,
    role          ENUM('mahasiswa', 'merchant', 'admin') DEFAULT 'mahasiswa',
    email_verified_at TIMESTAMP NULL,
    remember_token VARCHAR(100) NULL,
    created_at    TIMESTAMP NULL,
    updated_at    TIMESTAMP NULL
);

-- Profil detail mahasiswa
CREATE TABLE student_profiles (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL UNIQUE,
    photo_url       VARCHAR(500) NULL,          -- path ke storage
    phone           VARCHAR(20) NULL,
    bio             TEXT NULL,                   -- deskripsi singkat diri
    university      VARCHAR(255) NULL,           -- nama kampus
    faculty         VARCHAR(255) NULL,           -- fakultas
    major           VARCHAR(255) NULL,           -- program studi
    graduation_year YEAR NULL,                   -- angkatan/tahun lulus
    gpa             DECIMAL(3,2) NULL,           -- IPK (opsional)
    linkedin_url    VARCHAR(500) NULL,
    github_url      VARCHAR(500) NULL,
    instagram_url   VARCHAR(500) NULL,
    is_profile_public BOOLEAN DEFAULT TRUE,      -- visibilitas profil
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Keterampilan mahasiswa (free-text tags)
CREATE TABLE student_skills (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    skill_name  VARCHAR(100) NOT NULL,           -- contoh: "Barista", "Microsoft Excel"
    created_at  TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ketersediaan waktu kerja
CREATE TABLE student_availabilities (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    day_of_week ENUM('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu') NOT NULL,
    start_time  TIME NOT NULL,                   -- contoh: 08:00:00
    end_time    TIME NOT NULL,                   -- contoh: 14:00:00
    created_at  TIMESTAMP NULL,
    updated_at  TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CV Mahasiswa (multi-versi)
CREATE TABLE student_cvs (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    title       VARCHAR(255) NOT NULL,           -- contoh: "CV Barista", "CV Kasir"
    type        ENUM('upload', 'builder') NOT NULL, -- upload PDF atau dibuat dari form
    file_url    VARCHAR(500) NULL,               -- path jika type=upload
    is_primary  BOOLEAN DEFAULT FALSE,           -- CV utama yang dipakai melamar
    created_at  TIMESTAMP NULL,
    updated_at  TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Konten CV Builder (hanya untuk type=builder)
CREATE TABLE cv_builder_sections (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cv_id       BIGINT UNSIGNED NOT NULL,
    section     ENUM('education','experience','skills','achievements','about') NOT NULL,
    content     JSON NOT NULL,                   -- fleksibel per section
    sort_order  TINYINT DEFAULT 0,
    created_at  TIMESTAMP NULL,
    updated_at  TIMESTAMP NULL,
    FOREIGN KEY (cv_id) REFERENCES student_cvs(id) ON DELETE CASCADE
);

-- Portofolio Mahasiswa
CREATE TABLE student_portfolios (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT NULL,
    file_url    VARCHAR(500) NOT NULL,           -- path ke storage
    file_type   VARCHAR(50) NULL,               -- 'image/jpeg', 'application/pdf', dll
    file_size   INT NULL,                        -- dalam bytes
    thumbnail_url VARCHAR(500) NULL,             -- thumbnail untuk preview
    sort_order  TINYINT DEFAULT 0,
    created_at  TIMESTAMP NULL,
    updated_at  TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

> [!NOTE]
> Tabel `student_ratings`, `student_badges`, `job_applications`, `job_schedules` akan dibuat di TUB lain.
> Dashboard akan **join** ke tabel-tabel tersebut via API, tapi datanya dummy/null dulu.

---

## 4. API Endpoints (Laravel)

Base URL: `/api/v1`  
Auth: Bearer Token (Laravel Sanctum)

### 4.1 Dashboard

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/dashboard/summary` | Widget ringkasan: stat lamaran, jadwal, badge, rating, kursus, rekomendasi |

**Response `/dashboard/summary`:**
```json
{
  "applications": {
    "total": 12,
    "pending": 5,
    "interview": 2,
    "accepted": 3,
    "rejected": 2
  },
  "upcoming_schedules": [
    {
      "id": 1,
      "type": "interview",
      "merchant_name": "Kopi Sela",
      "position": "Barista",
      "scheduled_at": "2026-11-05T10:00:00Z",
      "location": "Jl. Gejayan No. 21, Yogyakarta"
    }
  ],
  "badges": [
    { "id": 1, "name": "Pekerja Aktif", "icon": "🏅", "earned_at": "2026-10-01" }
  ],
  "ratings": {
    "average": 4.8,
    "total_reviews": 6
  },
  "courses": {
    "in_progress": 2,
    "completed": 5
  },
  "recommended_jobs": [
    {
      "id": 1,
      "title": "Barista Part-Time",
      "merchant": "Kopi Sela",
      "wage": 25000,
      "location": "Gejayan"
    }
  ]
}
```

### 4.2 Profil Mahasiswa

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/profile` | Ambil profil mahasiswa login |
| PUT | `/profile` | Update info profil (text fields) |
| POST | `/profile/photo` | Upload foto profil |
| DELETE | `/profile/photo` | Hapus foto profil |
| GET | `/profile/skills` | List keterampilan |
| POST | `/profile/skills` | Tambah keterampilan |
| DELETE | `/profile/skills/{id}` | Hapus keterampilan |
| GET | `/profile/availability` | List ketersediaan waktu |
| PUT | `/profile/availability` | Update ketersediaan waktu (kirim semua) |

### 4.3 CV & Portofolio

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/cv` | List semua CV milik mahasiswa |
| POST | `/cv/upload` | Upload CV PDF |
| POST | `/cv/builder` | Simpan CV Builder |
| PUT | `/cv/{id}` | Update CV (title, konten builder) |
| DELETE | `/cv/{id}` | Hapus CV |
| PUT | `/cv/{id}/set-primary` | Jadikan CV utama |
| GET | `/portfolio` | List portofolio |
| POST | `/portfolio` | Upload item portofolio |
| PUT | `/portfolio/{id}` | Update judul/deskripsi |
| DELETE | `/portfolio/{id}` | Hapus item portofolio |

---

## 5. Validasi & Business Rules

### Foto Profil
- Format: `jpg`, `jpeg`, `png`, `webp`
- Maks ukuran: **2 MB**
- Otomatis di-resize ke 400×400 px (cropped center)

### CV Upload
- Format: **PDF only**
- Maks ukuran: **10 MB**
- Maks jumlah versi CV: **5 buah** per mahasiswa

### Portofolio
- Format: `jpg`, `jpeg`, `png`, `gif`, `pdf`
- Maks ukuran: **10 MB per file**
- Maks jumlah item: **20 buah** per mahasiswa

### Keterampilan
- Maks karakter per tag: **50**
- Maks jumlah keterampilan: **20**
- Case-insensitive (otomatis di-capitalize)

### Ketersediaan Waktu
- Boleh memilih 1–7 hari
- `start_time` harus lebih awal dari `end_time`
- Tidak boleh ada duplikasi hari yang sama

---

## 6. Struktur Folder Laravel

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── DashboardController.php
│   │   ├── ProfileController.php
│   │   ├── CvController.php
│   │   └── PortfolioController.php
│   ├── Requests/
│   │   ├── UpdateProfileRequest.php
│   │   ├── StoreCvRequest.php
│   │   └── StorePortfolioRequest.php
│   └── Resources/
│       ├── ProfileResource.php
│       ├── CvResource.php
│       └── PortfolioResource.php
├── Models/
│   ├── User.php
│   ├── StudentProfile.php
│   ├── StudentSkill.php
│   ├── StudentAvailability.php
│   ├── StudentCv.php
│   ├── CvBuilderSection.php
│   └── StudentPortfolio.php
database/
└── migrations/
    ├── create_student_profiles_table.php
    ├── create_student_skills_table.php
    ├── create_student_availabilities_table.php
    ├── create_student_cvs_table.php
    ├── create_cv_builder_sections_table.php
    └── create_student_portfolios_table.php
```

---

## 7. Struktur Folder React

```
src/
├── pages/
│   ├── Dashboard/
│   │   ├── DashboardPage.jsx
│   │   └── widgets/
│   │       ├── ApplicationSummaryWidget.jsx
│   │       ├── UpcomingScheduleWidget.jsx
│   │       ├── RecommendedJobsWidget.jsx
│   │       ├── BadgesWidget.jsx
│   │       ├── RatingWidget.jsx
│   │       └── CourseProgressWidget.jsx
│   ├── Profile/
│   │   ├── ProfilePage.jsx
│   │   ├── sections/
│   │   │   ├── PersonalInfoSection.jsx
│   │   │   ├── SkillsSection.jsx
│   │   │   ├── AvailabilitySection.jsx
│   │   │   └── SocialLinksSection.jsx
│   └── CV/
│       ├── CvPage.jsx
│       ├── CvUploadCard.jsx
│       ├── CvBuilderForm.jsx
│       └── PortfolioGrid.jsx
├── context/
│   └── AuthContext.jsx          -- user login state
├── hooks/
│   ├── useProfile.js
│   ├── useCv.js
│   └── useDashboard.js
├── services/
│   ├── api.js                   -- axios instance + interceptors
│   ├── profileService.js
│   ├── cvService.js
│   └── dashboardService.js
└── components/
    └── ui/                      -- komponen desain ParuhKita
```

---

## 8. Urutan Pengerjaan (Rekomendasi)

```
PHASE 1 — Backend & Database (Laravel)
  [ ] 1. Setup Laravel project + Sanctum auth
  [ ] 2. Buat semua migrations & jalankan
  [ ] 3. Buat Models dengan relationships
  [ ] 4. Buat FormRequests (validasi)
  [ ] 5. Buat Controllers + API Resources
  [ ] 6. Daftarkan routes di api.php
  [ ] 7. Test dengan Postman / Insomnia

PHASE 2 — Frontend (React)
  [ ] 8. Setup React + Axios + Context API
  [ ] 9. Buat service layer (api calls)
  [ ] 10. Halaman Dashboard + semua widget
  [ ] 11. Halaman Profil + form edit + upload foto
  [ ] 12. Halaman CV (upload + builder + portofolio)
  [ ] 13. Integrasi dengan API Laravel
  [ ] 14. UI polish dengan design system ParuhKita
```

---

## 9. Dependensi Antar TUB

| TUB | Hubungan |
|-----|----------|
| TUB-1 | Dashboard perlu data `lowongan` untuk widget rekomendasi |
| TUB-2 | Dashboard perlu data `lamaran` untuk widget status |
| TUB-7 | Dashboard perlu data `jadwal wawancara/trial shift` |
| TUB-10 | Dashboard perlu data `rating dari merchant` |
| TUB-14 | Dashboard perlu data `badge pencapaian` |

> [!IMPORTANT]
> Untuk sprint ini, widget yang bergantung ke TUB lain cukup tampilkan **data dummy/placeholder**. 
> Integrasi nyata dilakukan saat TUB terkait selesai.

---

## 10. Acceptance Criteria

- [ ] Mahasiswa dapat melihat dashboard dengan 6 widget (boleh dummy data)
- [ ] Mahasiswa dapat mengubah foto profil
- [ ] Mahasiswa dapat mengisi semua field profil dan tersimpan
- [ ] Mahasiswa dapat menambah/hapus keterampilan (tag)
- [ ] Mahasiswa dapat mengatur ketersediaan hari + jam
- [ ] Mahasiswa dapat menambah/hapus link sosial
- [ ] Mahasiswa dapat upload CV PDF (maks 10 MB, maks 5 versi)
- [ ] Mahasiswa dapat membuat CV via form builder
- [ ] Mahasiswa dapat set CV mana yang jadi "CV Utama"
- [ ] Mahasiswa dapat upload portofolio (maks 10 MB per file)
- [ ] Semua validasi berjalan (format file, ukuran, duplikasi)
- [ ] Semua endpoint API merespons dalam < 3 detik
- [ ] UI responsif (desktop & mobile)
- [ ] Profil dapat dilihat oleh semua aktor (mahasiswa, merchant, admin)
