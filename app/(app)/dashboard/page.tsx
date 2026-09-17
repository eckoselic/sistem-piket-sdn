import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import { LABEL_KATEGORI } from "@/types/database";
import Link from "next/link";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const supabase = createClient();
  const tanggal = todayISO();

  const [{ data: jadwalHariIni }, { data: presensiHariIni }, { data: jurnalTerbaru }] =
    await Promise.all([
      supabase
        .from("jadwal_piket")
        .select("id, guru_id, profiles(nama)")
        .eq("tanggal", tanggal),
      supabase.from("presensi").select("guru_id, status, jam_submit").eq("tanggal", tanggal),
      supabase
        .from("jurnal_kejadian")
        .select("id, judul, kategori, tanggal, jam_kejadian, profiles(nama)")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const presensiByGuru = new Map((presensiHariIni ?? []).map((p) => [p.guru_id, p]));
  const totalPetugas = jadwalHariIni?.length ?? 0;
  const sudahHadir = (jadwalHariIni ?? []).filter((j) => presensiByGuru.has(j.guru_id)).length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Ringkasan piket hari ini di SDN Jatinegara Kaum 07 Pagi."
      />

      <div className="p-6 md:p-10 space-y-8">
        {/* Kartu ringkasan */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-card border border-ink/8 bg-white p-5">
            <p className="text-xs text-slate-soft">Petugas piket hari ini</p>
            <p className="mt-2 text-3xl font-bold text-ink">{totalPetugas}</p>
            <p className="mt-1 text-xs text-slate-soft">guru terjadwal, shift 06.30–15.00</p>
          </div>
          <div className="rounded-card border border-ink/8 bg-white p-5">
            <p className="text-xs text-slate-soft">Sudah presensi</p>
            <p className="mt-2 text-3xl font-bold text-ok">
              {sudahHadir}
              <span className="text-lg text-slate-soft font-medium"> / {totalPetugas}</span>
            </p>
            <Link href="/presensi" className="mt-1 inline-block text-xs text-ink-light underline underline-offset-2">
              Buka presensi →
            </Link>
          </div>
          <div className="rounded-card border border-ink/8 bg-white p-5">
            <p className="text-xs text-slate-soft">Jurnal kejadian bulan ini</p>
            <p className="mt-2 text-3xl font-bold text-ink">{jurnalTerbaru?.length ?? 0}</p>
            <Link href="/jurnal" className="mt-1 inline-block text-xs text-ink-light underline underline-offset-2">
              Lihat jurnal →
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Petugas hari ini */}
          <div className="rounded-card border border-ink/8 bg-white p-5">
            <h2 className="font-semibold text-ink">Petugas piket hari ini</h2>
            {totalPetugas === 0 ? (
              <p className="mt-3 text-sm text-slate-soft">
                Belum ada jadwal untuk hari ini. Atur di halaman Jadwal Piket.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {(jadwalHariIni ?? []).map((j: any) => {
                  const hadir = presensiByGuru.get(j.guru_id);
                  return (
                    <li key={j.id} className="flex items-center justify-between text-sm">
                      <span className="text-ink">{j.profiles?.nama}</span>
                      {hadir ? (
                        <span className="text-xs font-medium text-ok bg-ok/10 px-2 py-1 rounded-full">
                          Hadir · {new Date(hadir.jam_submit).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-soft bg-ink/5 px-2 py-1 rounded-full">
                          Belum presensi
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Jurnal terbaru */}
          <div className="rounded-card border border-ink/8 bg-white p-5">
            <h2 className="font-semibold text-ink">Jurnal kejadian terbaru</h2>
            {!jurnalTerbaru || jurnalTerbaru.length === 0 ? (
              <p className="mt-3 text-sm text-slate-soft">Belum ada catatan jurnal.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {jurnalTerbaru.map((j: any) => (
                  <li key={j.id} className="text-sm border-l-2 border-gold pl-3">
                    <p className="text-ink font-medium">{j.judul}</p>
                    <p className="text-xs text-slate-soft mt-0.5">
                      {LABEL_KATEGORI[j.kategori as keyof typeof LABEL_KATEGORI]} · {j.profiles?.nama} · {j.tanggal}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
