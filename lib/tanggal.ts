// Semua fungsi di sini mengunci perhitungan tanggal ke zona waktu Asia/Jakarta (WIB),
// supaya tidak bergeser sehari akibat konversi ke UTC — baik saat dijalankan di
// browser (perangkat guru) maupun di server (Vercel, yang berjalan di UTC).

function bagianTanggalWIB(d: Date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const bagian = fmt.formatToParts(d);
  const ambil = (tipe: string) => bagian.find((b) => b.type === tipe)?.value ?? "00";
  return {
    tahun: Number(ambil("year")),
    bulan: Number(ambil("month")) - 1, // 0-indexed, mengikuti konvensi Date bawaan JS
    tanggal: Number(ambil("day")),
  };
}

/** Tanggal hari ini dalam format YYYY-MM-DD, sesuai kalender WIB. */
export function todayISO(): string {
  const { tahun, bulan, tanggal } = bagianTanggalWIB();
  return `${tahun}-${String(bulan + 1).padStart(2, "0")}-${String(tanggal).padStart(2, "0")}`;
}

/** Tahun & bulan (0-indexed) berjalan saat ini, sesuai kalender WIB. */
export function bulanTahunSekarangWIB(): { tahun: number; bulan: number } {
  const { tahun, bulan } = bagianTanggalWIB();
  return { tahun, bulan };
}

/** Rentang tanggal awal-akhir suatu bulan (bulan 0-indexed), aman dari pergeseran zona waktu. */
export function rentangBulan(tahun: number, bulanIndex: number): { awal: string; akhir: string } {
  const awal = `${tahun}-${String(bulanIndex + 1).padStart(2, "0")}-01`;
  const hariDalamBulan = new Date(Date.UTC(tahun, bulanIndex + 1, 0)).getUTCDate();
  const akhir = `${tahun}-${String(bulanIndex + 1).padStart(2, "0")}-${String(hariDalamBulan).padStart(2, "0")}`;
  return { awal, akhir };
}

/** Apakah saat ini (WIB) berada dalam jam presensi: pukul 06.00 sampai 15.00. */
export function dalamJamPresensi(d: Date = new Date()): boolean {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const bagian = fmt.formatToParts(d);
  const jam = Number(bagian.find((b) => b.type === "hour")?.value ?? 0) % 24;
  const menit = Number(bagian.find((b) => b.type === "minute")?.value ?? 0);
  const totalMenit = jam * 60 + menit;
  return totalMenit >= 6 * 60 && totalMenit <= 15 * 60;
}
