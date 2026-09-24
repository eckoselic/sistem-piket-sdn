-- =====================================================================
-- KOREKSI SKEMA GABUNGAN — jalankan di project Supabase piket
-- (menggantikan bagian arsip_* dan website_galeri dari skema sebelumnya
-- yang ternyata tidak sesuai struktur kode asli)
--
-- CATATAN: jalankan file ini SETELAH skema gabungan sebelumnya.
-- Ini hanya menghapus 4 tabel yang salah asumsi, lalu membuat ulang
-- versi yang benar-benar cocok dengan kode arsip-surat & website.
-- =====================================================================

-- Hapus tabel arsip yang salah asumsi (3 tabel terpisah).
-- Aslinya arsip surat cuma pakai 1 tabel gabungan masuk+keluar+disposisi.
drop table if exists arsip_disposisi cascade;
drop table if exists arsip_surat_keluar cascade;
drop table if exists arsip_surat_masuk cascade;

-- Hapus tabel galeri yang salah asumsi (1 tabel).
-- Aslinya galeri pakai 2 tabel: album + foto (dengan foreign key).
drop table if exists website_galeri cascade;


-- =====================================================================
-- ARSIP SURAT — struktur asli (1 tabel gabungan masuk & keluar)
-- =====================================================================

create table if not exists arsip_surat (
  id                  uuid primary key default gen_random_uuid(),
  jenis               text not null check (jenis in ('masuk', 'keluar')),
  nomor_surat         text not null,
  tanggal_surat       date not null,
  tanggal_terima      date,               -- hanya diisi untuk surat masuk
  perihal             text not null,
  pengirim_tujuan     text not null,      -- pengirim (masuk) / tujuan (keluar)
  kategori            text not null,
  file_url            text,
  file_nama           text,
  disposisi_untuk     text,
  disposisi_catatan   text,
  disposisi_status    text not null default 'belum' check (disposisi_status in ('belum', 'sudah')),
  dibuat_pada         timestamptz not null default now(),
  diperbarui_pada     timestamptz not null default now()
);

create index if not exists arsip_surat_jenis_idx on arsip_surat (jenis);
create index if not exists arsip_surat_tanggal_surat_idx on arsip_surat (tanggal_surat);
create index if not exists arsip_surat_kategori_idx on arsip_surat (kategori);

create or replace function set_diperbarui_pada()
returns trigger
language plpgsql
as $$
begin
  new.diperbarui_pada = now();
  return new;
end;
$$;

drop trigger if exists arsip_surat_set_diperbarui_pada on arsip_surat;
create trigger arsip_surat_set_diperbarui_pada
before update on arsip_surat
for each row execute function set_diperbarui_pada();

-- RLS aktif TANPA policy sama sekali (disengaja): akses hanya lewat
-- service_role key di route handler (Pola B, bukan Supabase Auth).
-- anon key/browser tidak pernah boleh menyentuh tabel ini langsung.
alter table arsip_surat enable row level security;

-- Storage: bucket "arsip-surat" (private) — tidak berubah dari sebelumnya.


-- =====================================================================
-- WEBSITE GALERI — struktur asli (2 tabel: album + foto)
-- =====================================================================

create table if not exists website_galeri_album (
  id          uuid default gen_random_uuid() primary key,
  judul       text not null,
  created_at  timestamptz default now()
);

alter table website_galeri_album enable row level security;

create policy "galeri_album_select_public"
on website_galeri_album for select
using (true);

create table if not exists website_galeri_foto (
  id          uuid default gen_random_uuid() primary key,
  album_id    uuid references website_galeri_album(id) on delete cascade not null,
  foto_url    text not null,
  keterangan  text,
  created_at  timestamptz default now()
);

alter table website_galeri_foto enable row level security;

create policy "galeri_foto_select_public"
on website_galeri_foto for select
using (true);

-- Storage: bucket "berita-gambar" dan "galeri-foto" (keduanya public)
-- — tidak berubah dari sebelumnya, tidak perlu dibuat ulang kalau
-- sudah ada dari setup awal masing-masing aplikasi.


-- =====================================================================
-- Tabel website_berita TIDAK berubah — strukturnya sudah cocok dari awal.
-- Tabel piket_* dan profiles TIDAK berubah di file ini.
-- =====================================================================
