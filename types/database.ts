export type PeranPengguna = "guru_piket" | "kepala_sekolah" | "admin_tu";
export type StatusPresensi = "hadir" | "terlambat" | "tidak_hadir";
export type KategoriJurnal =
  | "kesiswaan"
  | "fasilitas"
  | "tamu"
  | "kedisiplinan"
  | "lainnya";

export interface Profile {
  id: string;
  nama: string;
  nip: string | null;
  peran: PeranPengguna;
  aktif: boolean;
  created_at: string;
}

export interface JadwalPiket {
  id: string;
  tanggal: string;
  guru_id: string;
  ditukar_dengan: string | null;
  keterangan_tukar: string | null;
  dibuat_oleh: string | null;
  created_at: string;
  profiles?: Profile;
}

export interface KodeHarian {
  id: string;
  tanggal: string;
  kode: string;
  berlaku_sampai: string;
  created_at: string;
}

export interface Presensi {
  id: string;
  jadwal_id: string;
  guru_id: string;
  tanggal: string;
  jam_submit: string;
  status: StatusPresensi;
  kode_dipakai: string;
  foto_url: string | null;
  profiles?: Profile;
}

export interface JurnalKejadian {
  id: string;
  tanggal: string;
  guru_id: string;
  kategori: KategoriJurnal;
  judul: string;
  isi: string;
  jam_kejadian: string | null;
  created_at: string;
  profiles?: Profile;
}

export const LABEL_KATEGORI: Record<KategoriJurnal, string> = {
  kesiswaan: "Kesiswaan",
  fasilitas: "Fasilitas",
  tamu: "Tamu",
  kedisiplinan: "Kedisiplinan",
  lainnya: "Lainnya",
};

export const LABEL_PERAN: Record<PeranPengguna, string> = {
  guru_piket: "Guru Piket",
  kepala_sekolah: "Kepala Sekolah",
  admin_tu: "Admin TU",
};
