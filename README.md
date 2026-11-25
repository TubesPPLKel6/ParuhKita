# ParuhKita
Tugas Besar PPL Projek ParuhKita

## Menjalankan aplikasi lokal

Jalankan backend dari folder `paruhkita-api`:

```powershell
composer install
php artisan migrate
composer dev
```

`composer dev` menjalankan API, worker antrean, dan server WebSocket Reverb.
Jika API sudah berjalan di terminal lain dan Reverb belum aktif, gunakan `composer dev:messaging` dari folder backend. Jika Reverb sudah aktif, jalankan `php artisan queue:listen --tries=1 --timeout=0` saja agar tidak terjadi bentrok port.

Jalankan frontend di terminal lain:

```powershell
Set-Location ..\paruhkita-fe
npm install
Copy-Item .env.example .env.local
npm run dev
```

Jika backend memakai kredensial Reverb lokal yang berbeda dari contoh, samakan `VITE_REVERB_APP_KEY` di `paruhkita-fe/.env.local` dengan `REVERB_APP_KEY` di `paruhkita-api/.env`, lalu mulai ulang Vite. Ganti kredensial contoh sebelum deployment.
