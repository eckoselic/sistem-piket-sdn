"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import PageHeader from "@/components/PageHeader";
import { buatPdfRekap } from "@/lib/rekap-pdf";
import { rentangBulan, bulanTahunSekarangWIB } from "@/lib/tanggal";

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

type RingkasanGuru = {
  nama: string;
  hadir: number;
  terlambat: number;
  tidakHadir: number;
  jadwalTotal: number;
};

export default function RekapPage() {
  const supabase = createClient();
  const sekarang = bulanTahunSekarangWIB();
  const [bulan, setBulan] = useState(sekarang.bulan);
  const [tahun, setTahun] = useState(sekarang.tahun);
  const [ringkasan, setRingkasan] = useState<RingkasanGuru[]>([]);
  const [jurnalBulanIni, setJurnalBulanIni] = useState<any[]>([]);
  const [kepalaSekolah, setKepalaSekolah] = useState<{ nama: string; nip: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [membuatPdf, setMembuatPdf] = useState(false);

  const rentang = useMemo(() => rentangBulan(tahun, bulan), [bulan, tahun]);

  const muatData = useCallback(async () => {
    setLoading(true);
    const [{ data: jadwal }, { data: presensi }, { data: jurnal }] = await Promise.all([
      supabase
        .from("jadwal_piket")
        .select("guru_id, profiles!guru_id(nama)")
        .gte("tanggal", rentang.awal)
        .lte("tanggal", rentang.akhir),
      supabase
        .from("presensi")
        .select("guru_id, status")
        .gte("tanggal", rentang.awal)
        .lte("tanggal", rentang.akhir),
      supabase
        .from("jurnal_kejadian")
        .select("*, profiles(nama)")
        .gte("tanggal", rentang.awal)
        .lte("tanggal", rentang.akhir)
        .order("tanggal", { ascending: true }),
    ]);

    const perGuru = new Map<string, RingkasanGuru>();
    for (const j of (jadwal as any) ?? []) {
      const key = j.guru_id;
      const existing = perGuru.get(key) ?? {
        nama: j.profiles?.nama ?? "—",
        hadir: 0,
        terlambat: 0,
        tidakHadir: 0,
        jadwalTotal: 0,
      };
      existing.jadwalTotal += 1;
      perGuru.set(key, existing);
    }
    // Hitung hadir/terlambat dari presensi, sisanya dianggap tidak hadir
    const presensiPerGuru = new Map<string, { hadir: number; terlambat: number }>();
    for (const p of (presensi as any) ?? []) {
      const c = presensiPerGuru.get(p.guru_id) ?? { hadir: 0, terlambat: 0 };
      if (p.status === "hadir") c.hadir += 1;
      if (p.status === "terlambat") c.terlambat += 1;
      presensiPerGuru.set(p.guru_id, c);
    }
    for (const [guruId, ring] of perGuru.entries()) {
      const p = presensiPerGuru.get(guruId) ?? { hadir: 0, terlambat: 0 };
      ring.hadir = p.hadir;
      ring.terlambat = p.terlambat;
      ring.tidakHadir = Math.max(0, ring.jadwalTotal - p.hadir - p.terlambat);
    }

    setRingkasan(Array.from(perGuru.values()).sort((a, b) => a.nama.localeCompare(b.nama)));
    setJurnalBulanIni((jurnal as any) ?? []);
    setLoading(false);
  }, [supabase, rentang]);

  useEffect(() => {
    muatData();
  }, [muatData]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("nama, nip")
      .eq("peran", "kepala_sekolah")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setKepalaSekolah(data ?? null));
  }, [supabase]);

  async function handleExportPdf() {
    setMembuatPdf(true);
    try {
      await buatPdfRekap({
        bulanLabel: `${BULAN[bulan]} ${tahun}`,
        ringkasan,
        jurnal: jurnalBulanIni,
        kepalaSekolah,
      });
    } finally {
      setMembuatPdf(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Rekap Bulanan"
        description="Rekap kehadiran dan jurnal kejadian, siap dicetak dan diarsipkan."
        action={
          <button
            onClick={handleExportPdf}
            disabled={membuatPdf || loading}
            className="rounded-card bg-ink-light px-4 py-2 text-sm font-semibold text-paper hover:bg-ink disabled:opacity-60"
          >
            {membuatPdf ? "Menyusun PDF…" : "Unduh PDF"}
          </button>
        }
      />

      <div className="p-6 md:p-10 space-y-6">
        <div className="flex gap-3">
          <select
            value={bulan}
            onChange={(e) => setBulan(Number(e.target.value))}
            className="rounded-card border border-ink/15 px-3 py-2 text-sm outline-none focus:border-ink-light"
          >
            {BULAN.map((b, i) => (
              <option key={b} value={i}>{b}</option>
            ))}
          </select>
          <select
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            className="rounded-card border border-ink/15 px-3 py-2 text-sm outline-none focus:border-ink-light"
          >
            {[tahun - 1, tahun, tahun + 1].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="rounded-card border border-ink/8 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/8 text-left text-xs text-slate-soft">
                <th className="px-4 py-3 font-medium">Guru</th>
                <th className="px-4 py-3 font-medium">Jadwal</th>
                <th className="px-4 py-3 font-medium text-ok">Hadir</th>
                <th className="px-4 py-3 font-medium text-gold">Terlambat</th>
                <th className="px-4 py-3 font-medium text-danger">Tidak hadir</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-soft">Memuat…</td></tr>
              ) : ringkasan.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-soft">Tidak ada jadwal pada bulan ini.</td></tr>
              ) : (
                ringkasan.map((r) => (
                  <tr key={r.nama} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3 text-ink font-medium">{r.nama}</td>
                    <td className="px-4 py-3 text-ink">{r.jadwalTotal}</td>
                    <td className="px-4 py-3 text-ok">{r.hadir}</td>
                    <td className="px-4 py-3 text-gold">{r.terlambat}</td>
                    <td className="px-4 py-3 text-danger">{r.tidakHadir}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-card border border-ink/8 bg-white p-5">
          <h2 className="font-semibold text-ink">Jurnal kejadian bulan ini ({jurnalBulanIni.length})</h2>
          <p className="mt-1 text-xs text-slate-soft">
            Seluruh catatan ini akan disertakan pada lampiran PDF rekap.
          </p>
        </div>
      </div>
    </div>
  );
}
