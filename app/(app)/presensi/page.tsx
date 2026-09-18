"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import PageHeader from "@/components/PageHeader";
import type { PeranPengguna } from "@/types/database";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function generateKode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

type BarisJadwal = {
  id: string;
  guru_id: string;
  profiles: { nama: string } | null;
};

export default function PresensiPage() {
  const supabase = createClient();
  const tanggal = todayISO();

  const [userId, setUserId] = useState<string | null>(null);
  const [peran, setPeran] = useState<PeranPengguna>("guru_piket");
  const [jadwalHariIni, setJadwalHariIni] = useState<BarisJadwal[]>([]);
  const [presensiMap, setPresensiMap] = useState<Map<string, any>>(new Map());
  const [kodeAktif, setKodeAktif] = useState<{ kode: string; berlaku_sampai: string } | null>(null);
  const [inputKode, setInputKode] = useState("");
  const [pesan, setPesan] = useState<{ tipe: "ok" | "error"; teks: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [memproses, setMemproses] = useState(false);

  const muatData = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id ?? null;
    setUserId(uid);

    if (uid) {
      const { data: profile } = await supabase.from("profiles").select("peran").eq("id", uid).single();
      if (profile) setPeran(profile.peran);
    }

    const [{ data: jadwal }, { data: presensi }, { data: kode }] = await Promise.all([
      supabase.from("jadwal_piket").select("id, guru_id, profiles!guru_id(nama)").eq("tanggal", tanggal),
      supabase.from("presensi").select("*").eq("tanggal", tanggal),
      supabase.from("kode_harian").select("kode, berlaku_sampai").eq("tanggal", tanggal).maybeSingle(),
    ]);

    setJadwalHariIni((jadwal as any) ?? []);
    setPresensiMap(new Map((presensi ?? []).map((p: any) => [p.guru_id, p])));
    setKodeAktif(kode ?? null);
    setLoading(false);
  }, [supabase, tanggal]);

  useEffect(() => {
    muatData();
  }, [muatData]);

  const jadwalSaya = jadwalHariIni.find((j) => j.guru_id === userId);
  const sudahPresensi = userId ? presensiMap.has(userId) : false;

  async function handleGenerateKode() {
    setMemproses(true);
    const kodeBaru = generateKode();
    const berlakuSampai = new Date();
    berlakuSampai.setHours(15, 0, 0, 0);

    const { error } = await supabase.from("kode_harian").upsert({ tanggal, kode: kodeBaru, berlaku_sampai: berlakuSampai.toISOString() }, { onConflict: "tanggal" });

    setMemproses(false);
    if (error) {
      setPesan({ tipe: "error", teks: "Gagal membuat kode. Coba lagi." });
      return;
    }
    setPesan({ tipe: "ok", teks: `Kode hari ini: ${kodeBaru}` });
    muatData();
  }

  async function handleSubmitPresensi(e: React.FormEvent) {
    e.preventDefault();
    if (!jadwalSaya || !userId) return;
    setMemproses(true);
    setPesan(null);

    if (!kodeAktif) {
      setPesan({ tipe: "error", teks: "Kode presensi hari ini belum digenerate oleh Admin TU." });
      setMemproses(false);
      return;
    }
    if (new Date() > new Date(kodeAktif.berlaku_sampai)) {
      setPesan({ tipe: "error", teks: "Kode hari ini sudah tidak berlaku (lewat jam 15.00)." });
      setMemproses(false);
      return;
    }
    if (inputKode.trim() !== kodeAktif.kode) {
      setPesan({ tipe: "error", teks: "Kode yang dimasukkan tidak cocok." });
      setMemproses(false);
      return;
    }

    const jamMasuk = new Date();
    const status = jamMasuk.getHours() >= 7 ? "terlambat" : "hadir";

    const { error } = await supabase.from("presensi").insert({
      jadwal_id: jadwalSaya.id,
      guru_id: userId,
      tanggal,
      status,
      kode_dipakai: inputKode.trim(),
    });

    setMemproses(false);
    if (error) {
      setPesan({ tipe: "error", teks: "Presensi gagal disimpan. Kemungkinan sudah tercatat sebelumnya." });
      return;
    }
    setPesan({ tipe: "ok", teks: "Presensi berhasil dicatat. Terima kasih!" });
    setInputKode("");
    muatData();
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Presensi" description="Memuat data hari ini…" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Presensi Guru Piket" description="Kode presensi berlaku hari ini saja, ditampilkan di ruang guru pukul 06.00–15.00." />

      <div className="p-6 md:p-10 space-y-6 max-w-3xl">
        {peran === "admin_tu" && (
          <div className="rounded-card border border-ink/8 bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-ink">Kode presensi hari ini</h2>
                <p className="text-sm text-slate-soft mt-1">{kodeAktif ? `Aktif: ${kodeAktif.kode} (berlaku sampai jam 15.00)` : "Belum digenerate."}</p>
              </div>
              <button onClick={handleGenerateKode} disabled={memproses} className="shrink-0 rounded-card bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90 disabled:opacity-60">
                {kodeAktif ? "Buat ulang kode" : "Generate kode"}
              </button>
            </div>
          </div>
        )}

        {jadwalSaya && (
          <div className="rounded-card border border-ink/8 bg-white p-5">
            <h2 className="font-semibold text-ink">Presensi saya</h2>
            {sudahPresensi ? (
              <p className="mt-3 text-sm text-ok font-medium">
                Anda sudah presensi hari ini pukul{" "}
                {new Date(presensiMap.get(userId!).jam_submit).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Jakarta",
                })}
                .
              </p>
            ) : (
              <form onSubmit={handleSubmitPresensi} className="mt-3 flex gap-3">
                <input
                  value={inputKode}
                  onChange={(e) => setInputKode(e.target.value)}
                  inputMode="numeric"
                  placeholder="Masukkan kode 6 digit"
                  className="flex-1 rounded-card border border-ink/15 px-3 py-2 text-sm focus:border-ink-light outline-none"
                />
                <button type="submit" disabled={memproses} className="rounded-card bg-ink-light px-4 py-2 text-sm font-semibold text-paper hover:bg-ink disabled:opacity-60">
                  Kirim
                </button>
              </form>
            )}
          </div>
        )}

        {!jadwalSaya && peran === "guru_piket" && <p className="text-sm text-slate-soft">Anda tidak terjadwal piket hari ini.</p>}

        {pesan && <p className={`text-sm ${pesan.tipe === "ok" ? "text-ok" : "text-danger"}`}>{pesan.teks}</p>}

        <div className="rounded-card border border-ink/8 bg-white p-5">
          <h2 className="font-semibold text-ink">Status petugas hari ini</h2>
          {jadwalHariIni.length === 0 ? (
            <p className="mt-3 text-sm text-slate-soft">Belum ada jadwal piket untuk hari ini.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {jadwalHariIni.map((j) => {
                const p = presensiMap.get(j.guru_id);
                return (
                  <li key={j.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{j.profiles?.nama}</span>
                    {p ? (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.status === "hadir" ? "text-ok bg-ok/10" : "text-gold bg-gold/15"}`}>{p.status === "hadir" ? "Hadir" : "Terlambat"}</span>
                    ) : (
                      <span className="text-xs font-medium text-slate-soft bg-ink/5 px-2 py-1 rounded-full">Belum presensi</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
