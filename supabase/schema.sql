-- =========================================================
-- SKEMA DATABASE — Sistem Manajemen Guru Piket
-- SDN Jatinegara Kaum 07 Pagi
-- Jalankan di Supabase SQL Editor (satu kali, urut dari atas)
-- =========================================================

-- 1. ENUM PERAN & STATUS ------------------------------------------------
create type peran_pengguna as enum ('guru_piket', 'kepala_sekolah', 'admin_tu');
create type status_presensi as enum ('hadir', 'terlambat', 'tidak_hadir');
create type kategori_jurnal as enum ('kesiswaan', 'fasilitas', 'tamu', 'kedisiplinan', 'lainnya');

-- 2. PROFIL PENGGUNA (terhubung ke auth.users bawaan Supabase) ---------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  nip text,
  peran peran_pengguna not null default 'guru_piket',
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. JADWAL PIKET ---------------------------------------------------------
-- Satu baris = satu guru bertugas piket pada satu tanggal (3 guru/hari)
create table jadwal_piket (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  guru_id uuid not null references profiles(id) on delete cascade,
  ditukar_dengan uuid references profiles(id) on delete set null,
  keterangan_tukar text,
  dibuat_oleh uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (tanggal, guru_id)
);

-- 4. KODE PRESENSI HARIAN -------------------------------------------------
-- Digenerate otomatis oleh sistem (cron/edge function) tiap jam 06:00
create table kode_harian (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null unique,
  kode text not null,
  berlaku_sampai timestamptz not null,
  created_at timestamptz not null default now()
);

-- 5. PRESENSI GURU PIKET ---------------------------------------------------
create table presensi (
  id uuid primary key default gen_random_uuid(),
  jadwal_id uuid not null references jadwal_piket(id) on delete cascade,
  guru_id uuid not null references profiles(id),
  tanggal date not null,
  jam_submit timestamptz not null default now(),
  status status_presensi not null default 'hadir',
  kode_dipakai text not null,
  unique (jadwal_id)
);

-- 6. JURNAL KEJADIAN --------------------------------------------------------
create table jurnal_kejadian (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  guru_id uuid not null references profiles(id),
  kategori kategori_jurnal not null default 'lainnya',
  judul text not null,
  isi text not null,
  jam_kejadian time,
  created_at timestamptz not null default now()
);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table profiles enable row level security;
alter table jadwal_piket enable row level security;
alter table kode_harian enable row level security;
alter table presensi enable row level security;
alter table jurnal_kejadian enable row level security;

-- Helper: fungsi ambil peran pengguna saat ini
create or replace function peran_saya() returns peran_pengguna as $$
  select peran from profiles where id = auth.uid();
$$ language sql stable security definer;

-- profiles: semua yang login boleh lihat daftar guru (untuk jadwal/tukar piket)
create policy "profiles_select_all" on profiles for select using (auth.uid() is not null);
create policy "profiles_update_self" on profiles for update using (id = auth.uid());
create policy "profiles_admin_manage" on profiles for all using (peran_saya() = 'admin_tu');

-- jadwal_piket: semua login boleh lihat; hanya admin_tu yang membuat/mengubah;
-- guru pemilik baris boleh update untuk keperluan tukar piket
create policy "jadwal_select_all" on jadwal_piket for select using (auth.uid() is not null);
create policy "jadwal_admin_write" on jadwal_piket for insert with check (peran_saya() = 'admin_tu');
create policy "jadwal_admin_delete" on jadwal_piket for delete using (peran_saya() = 'admin_tu');
create policy "jadwal_tukar_piket" on jadwal_piket for update using (
  guru_id = auth.uid() or peran_saya() = 'admin_tu'
);

-- kode_harian: semua login boleh baca (untuk validasi submit); hanya sistem/admin yang menulis
create policy "kode_select_all" on kode_harian for select using (auth.uid() is not null);
create policy "kode_admin_write" on kode_harian for insert with check (peran_saya() = 'admin_tu');

-- presensi: guru hanya boleh submit presensi miliknya sendiri; semua login boleh lihat (rekap)
create policy "presensi_select_all" on presensi for select using (auth.uid() is not null);
create policy "presensi_insert_self" on presensi for insert with check (guru_id = auth.uid());

-- jurnal_kejadian: guru boleh tulis jurnal atas namanya sendiri; semua login boleh baca
create policy "jurnal_select_all" on jurnal_kejadian for select using (auth.uid() is not null);
create policy "jurnal_insert_self" on jurnal_kejadian for insert with check (guru_id = auth.uid());
create policy "jurnal_update_self" on jurnal_kejadian for update using (guru_id = auth.uid());

-- =========================================================
-- TRIGGER: buat baris profiles otomatis saat user baru mendaftar
-- =========================================================
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, nama, peran)
  values (new.id, coalesce(new.raw_user_meta_data->>'nama', new.email), 'guru_piket');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =========================================================
-- CATATAN: generate kode_harian
-- Buat Edge Function terjadwal (Supabase Cron, jam 06:00 WIB) yang:
--   1. Generate kode acak 6 digit
--   2. Insert ke kode_harian dengan tanggal = hari ini,
--      berlaku_sampai = hari ini jam 15:00 WIB
-- Sebagai fallback awal, admin_tu juga bisa generate manual dari halaman Jadwal.
-- =========================================================
