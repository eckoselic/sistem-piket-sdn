# Sistem Manajemen Guru Piket — SDN Jatinegara Kaum 07 Pagi

Aplikasi web untuk mengelola piket harian: presensi guru piket dengan kode
harian, jadwal piket (3 guru/hari, shift 06.30–15.00), jurnal kejadian, dan
rekap bulanan siap cetak (PDF).

**Stack:** Next.js 14 (App Router) + Supabase (Postgres, Auth, RLS) + Vercel.
Semuanya bisa berjalan di tingkat gratis (free tier).

---

## 1. Siapkan proyek Supabase

1. Buat akun/project baru di [supabase.com](https://supabase.com) (gratis).
2. Buka **SQL Editor**, salin seluruh isi `supabase/schema.sql`, lalu jalankan.
   Ini akan membuat semua tabel, tipe data, dan aturan Row Level Security (RLS).
3. Buka **Project Settings → API**, salin:
   - `Project URL` → jadi `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → jadi `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Membuat akun pengguna pertama (Admin TU)

1. Di Supabase dashboard, buka **Authentication → Users → Add user**, buat
   akun untuk Admin TU (email + password).
2. Buka **Table Editor → profiles**, cari baris yang otomatis dibuat untuk
   user tadi, lalu ubah kolom `peran` menjadi `admin_tu` dan isi `nama`.
3. Ulangi untuk membuat akun 15 guru piket (peran default sudah `guru_piket`)
   dan akun Kepala Sekolah (ubah `peran` menjadi `kepala_sekolah`).

> Ke depannya, Admin TU bisa menambah guru baru langsung dari Supabase
> Authentication, lalu menyesuaikan `nama` di tabel `profiles`.

---

## 2. Jalankan di komputer (opsional, untuk pengembangan)

```bash
npm install
cp .env.local.example .env.local   # lalu isi dengan kredensial Supabase Anda
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## 3. Deploy ke Vercel (gratis)

1. Push folder ini ke repository GitHub.
2. Di [vercel.com](https://vercel.com), pilih **New Project** → impor repo tsb.
3. Pada langkah **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**. Selesai — aplikasi bisa diakses lewat HP maupun komputer.

---

## 4. Logo untuk kop surat PDF rekap

Rekap bulanan (halaman **Rekap**) menghasilkan PDF dengan kop surat. Tempatkan
file logo di folder `public/` dengan nama persis berikut:

- `public/logo-sekolah.png` — logo SDN Jatinegara Kaum 07 Pagi
- `public/logo-jayaraya.png` — logo Jaya Raya Provinsi DKI Jakarta

Jika file belum ada, PDF tetap dibuat tanpa logo (kop surat teks tetap tampil).
Gunakan gambar PNG persegi, idealnya 200×200px, agar tidak gepeng.

---

## 5. Kode presensi harian

Kode presensi (6 digit) perlu tersedia setiap hari, berlaku sampai jam 15.00.
Ada dua cara:

- **Manual (sudah tersedia):** akun Admin TU membuka halaman **Presensi**,
  lalu klik "Generate kode" setiap pagi. Kode ditampilkan di layar untuk
  ditulis ulang di ruang guru (papan tulis/kertas).
- **Otomatis (opsional, pengembangan lanjutan):** buat Supabase Edge Function
  terjadwal (cron) jam 06:00 WIB yang menjalankan logika yang sama — lihat
  catatan di bagian bawah `supabase/schema.sql`.

---

## 6. Struktur peran pengguna

| Peran | Bisa apa |
|---|---|
| **Guru Piket** | Presensi diri sendiri, isi jurnal kejadian, ajukan tukar piket |
| **Kepala Sekolah** | Melihat dashboard, jadwal, jurnal, dan rekap (read-only) |
| **Admin TU** | Semua di atas + kelola jadwal piket, generate kode presensi, kelola akun guru |

---

## 7. Struktur folder singkat

```
app/
  login/            → halaman masuk
  (app)/
    dashboard/       → ringkasan piket hari ini
    presensi/        → submit & lihat presensi harian
    jadwal/          → jadwal bulanan + tukar piket
    jurnal/          → catat & lihat jurnal kejadian
    rekap/           → rekap bulanan + export PDF
lib/
  supabase/          → koneksi ke Supabase (client, server, middleware)
  rekap-pdf.ts        → penyusun PDF rekap bulanan
supabase/
  schema.sql          → skema database lengkap + RLS
```
