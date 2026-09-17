"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import PageHeader from "@/components/PageHeader";
import { LABEL_KATEGORI, type KategoriJurnal, type JurnalKejadian } from "@/types/database";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const KATEGORI_OPSI: KategoriJurnal[] = ["kesiswaan", "fasilitas", "tamu", "kedisiplinan", "lainnya"];

export default function JurnalPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [entri, setEntri] = useState<JurnalKejadian[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterKategori, setFilterKategori] = useState<KategoriJurnal | "semua">("semua");
  const [form, setForm] = useState({
    kategori: "lainnya" as KategoriJurnal,
    judul: "",
    isi: "",
    jam_kejadian: "",
  });
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  const muatData = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    setUserId(authData.user?.id ?? null);

    const { data } = await supabase
      .from("jurnal_kejadian")
      .select("*, profiles(nama)")
      .order("tanggal", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    setEntri((data as any) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    muatData();
  }, [muatData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !form.judul.trim() || !form.isi.trim()) return;
    setMenyimpan(true);

    const { error } = await supabase.from("jurnal_kejadian").insert({
      tanggal: todayISO(),
      guru_id: userId,
      kategori: form.kategori,
      judul: form.judul.trim(),
      isi: form.isi.trim(),
      jam_kejadian: form.jam_kejadian || null,
    });

    setMenyimpan(false);
    if (error) {
      setPesan("Jurnal gagal disimpan. Coba lagi.");
      return;
    }
    setForm({ kategori: "lainnya", judul: "", isi: "", jam_kejadian: "" });
    setPesan(null);
    muatData();
  }

  const entriTampil = entri.filter((e) => filterKategori === "semua" || e.kategori === filterKategori);

  return (
    <div>
      <PageHeader
        title="Jurnal Kejadian"
        description="Catatan kejadian selama piket — kesiswaan, fasilitas, tamu, atau hal lain yang perlu didokumentasikan."
      />

      <div className="p-6 md:p-10 grid lg:grid-cols-[380px_1fr] gap-6">
        {/* Form tambah jurnal */}
        <form onSubmit={handleSubmit} className="rounded-card border border-ink/8 bg-white p-5 h-fit space-y-4">
          <h2 className="font-semibold text-ink">Catat kejadian baru</h2>

          <div>
            <label className="block text-xs font-medium text-ink mb-1">Kategori</label>
            <select
              value={form.kategori}
              onChange={(e) => setForm((f) => ({ ...f, kategori: e.target.value as KategoriJurnal }))}
              className="w-full rounded-card border border-ink/15 px-3 py-2 text-sm outline-none focus:border-ink-light"
            >
              {KATEGORI_OPSI.map((k) => (
                <option key={k} value={k}>{LABEL_KATEGORI[k]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1">Jam kejadian (opsional)</label>
            <input
              type="time"
              value={form.jam_kejadian}
              onChange={(e) => setForm((f) => ({ ...f, jam_kejadian: e.target.value }))}
              className="w-full rounded-card border border-ink/15 px-3 py-2 text-sm outline-none focus:border-ink-light"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1">Judul singkat</label>
            <input
              value={form.judul}
              onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
              required
              placeholder="Mis. Siswa terjatuh di lapangan"
              className="w-full rounded-card border border-ink/15 px-3 py-2 text-sm outline-none focus:border-ink-light"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1">Uraian kejadian</label>
            <textarea
              value={form.isi}
              onChange={(e) => setForm((f) => ({ ...f, isi: e.target.value }))}
              required
              rows={4}
              placeholder="Jelaskan kronologi, tindakan yang diambil, dan tindak lanjut jika ada."
              className="w-full rounded-card border border-ink/15 px-3 py-2 text-sm outline-none focus:border-ink-light"
            />
          </div>

          {pesan && <p className="text-sm text-danger">{pesan}</p>}

          <button
            type="submit"
            disabled={menyimpan}
            className="w-full rounded-card bg-ink-light py-2.5 text-sm font-semibold text-paper hover:bg-ink disabled:opacity-60"
          >
            {menyimpan ? "Menyimpan…" : "Simpan jurnal"}
          </button>
        </form>

        {/* Daftar jurnal */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setFilterKategori("semua")}
              className={`text-xs px-3 py-1.5 rounded-full font-medium ${filterKategori === "semua" ? "bg-ink text-paper" : "bg-ink/5 text-ink"}`}
            >
              Semua
            </button>
            {KATEGORI_OPSI.map((k) => (
              <button
                key={k}
                onClick={() => setFilterKategori(k)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium ${filterKategori === k ? "bg-ink text-paper" : "bg-ink/5 text-ink"}`}
              >
                {LABEL_KATEGORI[k]}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-slate-soft">Memuat jurnal…</p>
          ) : entriTampil.length === 0 ? (
            <p className="text-sm text-slate-soft">Belum ada catatan pada kategori ini.</p>
          ) : (
            <ul className="space-y-3">
              {entriTampil.map((e: any) => (
                <li key={e.id} className="rounded-card border border-ink/8 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-ink text-sm">{e.judul}</p>
                    <span className="text-xs text-gold bg-gold/15 px-2 py-0.5 rounded-full shrink-0">
                      {LABEL_KATEGORI[e.kategori as KategoriJurnal]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-soft mt-1.5">{e.isi}</p>
                  <p className="text-xs text-slate-soft/80 mt-2">
                    {e.profiles?.nama} · {new Date(e.tanggal + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    {e.jam_kejadian ? ` · pukul ${e.jam_kejadian.slice(0, 5)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
