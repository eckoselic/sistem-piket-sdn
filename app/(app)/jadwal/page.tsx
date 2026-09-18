"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import PageHeader from "@/components/PageHeader";
import type { PeranPengguna, Profile } from "@/types/database";

function bulanBerjalanRange() {
  const now = new Date();
  const awal = new Date(now.getFullYear(), now.getMonth(), 1);
  const akhir = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { awal: awal.toISOString().slice(0, 10), akhir: akhir.toISOString().slice(0, 10) };
}

type Baris = {
  id: string;
  tanggal: string;
  guru_id: string;
  ditukar_dengan: string | null;
  keterangan_tukar: string | null;
  profiles: { nama: string } | null;
};

export default function JadwalPage() {
  const supabase = createClient();
  const { awal, akhir } = bulanBerjalanRange();

  const [userId, setUserId] = useState<string | null>(null);
  const [peran, setPeran] = useState<PeranPengguna>("guru_piket");
  const [jadwal, setJadwal] = useState<Baris[]>([]);
  const [guruList, setGuruList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [formTambah, setFormTambah] = useState({ tanggal: "", guru_id: "" });
  const [tukarUntuk, setTukarUntuk] = useState<string | null>(null);
  const [tukarDengan, setTukarDengan] = useState("");
  const [pesan, setPesan] = useState<string | null>(null);

  const muatData = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id ?? null;
    setUserId(uid);
    if (uid) {
      const { data: profile } = await supabase.from("profiles").select("peran").eq("id", uid).single();
      if (profile) setPeran(profile.peran);
    }

    const [{ data: jd }, { data: guru }] = await Promise.all([
      supabase.from("jadwal_piket").select("id, tanggal, guru_id, ditukar_dengan, keterangan_tukar, profiles!guru_id(nama)").gte("tanggal", awal).lte("tanggal", akhir).order("tanggal", { ascending: true }),
      supabase.from("profiles").select("*").eq("peran", "guru_piket").eq("aktif", true).order("nama"),
    ]);

    setJadwal((jd as any) ?? []);
    setGuruList(guru ?? []);
    setLoading(false);
  }, [supabase, awal, akhir]);

  useEffect(() => {
    muatData();
  }, [muatData]);

  const perTanggal = useMemo(() => {
    const map = new Map<string, Baris[]>();
    for (const j of jadwal) {
      const arr = map.get(j.tanggal) ?? [];
      arr.push(j);
      map.set(j.tanggal, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [jadwal]);

  async function handleTambah(e: React.FormEvent) {
    e.preventDefault();
    if (!formTambah.tanggal || !formTambah.guru_id) return;
    const { error } = await supabase.from("jadwal_piket").insert({
      tanggal: formTambah.tanggal,
      guru_id: formTambah.guru_id,
      dibuat_oleh: userId,
    });
    if (error) {
      setPesan("Gagal menambah jadwal — mungkin guru ini sudah terjadwal di tanggal itu.");
      return;
    }
    setFormTambah({ tanggal: "", guru_id: "" });
    setPesan(null);
    muatData();
  }

  async function handleAjukanTukar(jadwalId: string) {
    if (!tukarDengan) return;
    const { error } = await supabase.from("jadwal_piket").update({ ditukar_dengan: tukarDengan, keterangan_tukar: "Disepakati kedua guru" }).eq("id", jadwalId);
    if (error) {
      setPesan("Gagal mengajukan tukar piket.");
      return;
    }
    setTukarUntuk(null);
    setTukarDengan("");
    muatData();
  }

  if (loading) return <PageHeader title="Jadwal Piket" description="Memuat jadwal…" />;

  return (
    <div>
      <PageHeader title="Jadwal Piket" description="Tiga guru bertugas per hari, shift 06.30–15.00. Tukar piket cukup kesepakatan dua guru." />

      <div className="p-6 md:p-10 space-y-6">
        {peran === "admin_tu" && (
          <form onSubmit={handleTambah} className="rounded-card border border-ink/8 bg-white p-5 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={formTambah.tanggal}
                onChange={(e) => setFormTambah((f) => ({ ...f, tanggal: e.target.value }))}
                className="rounded-card border border-ink/15 px-3 py-2 text-sm outline-none focus:border-ink-light"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Guru piket</label>
              <select
                required
                value={formTambah.guru_id}
                onChange={(e) => setFormTambah((f) => ({ ...f, guru_id: e.target.value }))}
                className="rounded-card border border-ink/15 px-3 py-2 text-sm outline-none focus:border-ink-light min-w-[200px]"
              >
                <option value="">Pilih guru…</option>
                {guruList.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nama}
                  </option>
                ))}
              </select>
            </div>
            <button className="rounded-card bg-ink-light px-4 py-2 text-sm font-semibold text-paper hover:bg-ink">Tambah ke jadwal</button>
          </form>
        )}

        {pesan && <p className="text-sm text-danger">{pesan}</p>}

        <div className="space-y-4">
          {perTanggal.length === 0 && <p className="text-sm text-slate-soft">Belum ada jadwal piket bulan ini.</p>}
          {perTanggal.map(([tanggal, baris]) => (
            <div key={tanggal} className="rounded-card border border-ink/8 bg-white p-5">
              <p className="text-sm font-semibold text-ink">
                {new Date(tanggal + "T00:00:00").toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <ul className="mt-3 grid sm:grid-cols-3 gap-3">
                {baris.map((b) => (
                  <li key={b.id} className="rounded-card bg-paper border border-ink/8 p-3">
                    <p className="text-sm text-ink font-medium">{b.profiles?.nama}</p>
                    {b.ditukar_dengan ? (
                      <p className="text-xs text-gold mt-1">Ditukar dengan {guruList.find((g) => g.id === b.ditukar_dengan)?.nama ?? "guru lain"}</p>
                    ) : b.guru_id === userId ? (
                      tukarUntuk === b.id ? (
                        <div className="mt-2 flex gap-2">
                          <select value={tukarDengan} onChange={(e) => setTukarDengan(e.target.value)} className="text-xs rounded border border-ink/15 px-1.5 py-1 flex-1">
                            <option value="">Tukar dengan…</option>
                            {guruList
                              .filter((g) => g.id !== userId)
                              .map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.nama}
                                </option>
                              ))}
                          </select>
                          <button onClick={() => handleAjukanTukar(b.id)} className="text-xs font-semibold text-ink-light">
                            Simpan
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setTukarUntuk(b.id)} className="mt-1 text-xs text-ink-light underline underline-offset-2">
                          Ajukan tukar piket
                        </button>
                      )
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
