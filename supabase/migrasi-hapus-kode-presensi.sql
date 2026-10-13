-- =========================================================
-- MIGRASI: Presensi hanya dengan foto (tanpa kode presensi)
-- Jalankan di Supabase SQL Editor (project yang sudah berjalan),
-- SEBELUM kode aplikasi versi baru di-push.
-- =========================================================

-- 1. Kolom kode_dipakai tidak lagi diisi, jadi tidak boleh wajib
alter table presensi alter column kode_dipakai drop not null;

-- 2. Batasi pengiriman presensi hanya pukul 06.00 s.d. 15.00 WIB
--    (dijaga di database, jadi tidak bisa dilewati lewat manipulasi di browser)
drop policy if exists "presensi_insert_self" on presensi;

create policy "presensi_insert_self" on presensi for insert with check (
  guru_id = auth.uid()
  and (now() at time zone 'Asia/Jakarta')::time >= time '06:00'
  and (now() at time zone 'Asia/Jakarta')::time < time '15:01'
);

-- 3. (Opsional) Tabel kode_harian sudah tidak dipakai aplikasi.
--    Boleh dibiarkan, atau dihapus dengan menghapus tanda komentar baris di bawah.
-- drop table if exists kode_harian;
