-- =========================================================
-- MIGRASI: Foto Absen Presensi
-- Jalankan di Supabase SQL Editor (project yang sudah berjalan)
-- =========================================================

-- 1. Tambah kolom foto_url pada tabel presensi
alter table presensi add column if not exists foto_url text;

-- 2. Buat bucket penyimpanan untuk foto absen (public read, agar bisa
--    ditampilkan/dilampirkan di rekap tanpa perlu signed URL)
insert into storage.buckets (id, name, public)
values ('foto-presensi', 'foto-presensi', true)
on conflict (id) do nothing;

-- 3. Kebijakan akses bucket:
--    - Siapa saja yang login boleh mengunggah foto
--    - Foto boleh dibaca publik (supaya bisa ditampilkan di halaman/PDF)
create policy "foto_presensi_upload"
on storage.objects for insert
with check (bucket_id = 'foto-presensi' and auth.uid() is not null);

create policy "foto_presensi_update"
on storage.objects for update
using (bucket_id = 'foto-presensi' and auth.uid() is not null);

create policy "foto_presensi_read"
on storage.objects for select
using (bucket_id = 'foto-presensi');
