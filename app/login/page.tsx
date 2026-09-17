"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError("Email atau kata sandi belum cocok. Coba periksa lagi.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Panel identitas sekolah */}
      <div className="hidden md:flex flex-col justify-between bg-ink text-paper p-12 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-sm tracking-wide text-gold-soft/80">SDN Jatinegara Kaum 07 Pagi</p>
          <h1 className="mt-6 text-4xl font-bold leading-tight max-w-sm">
            Piket harian, tercatat rapi setiap hari.
          </h1>
          <p className="mt-4 text-paper/70 max-w-sm">
            Satu tempat untuk presensi, jadwal, dan jurnal kejadian guru piket —
            dari ruang guru sampai laporan bulanan kepala sekolah.
          </p>
        </div>

        {/* Ilustrasi jadwal sederhana sebagai elemen visual */}
        <svg
          className="relative z-10 mt-10"
          width="280"
          height="140"
          viewBox="0 0 280 140"
          fill="none"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={i * 56 + 4}
              y={i % 2 === 0 ? 30 : 55}
              width="44"
              height={i % 2 === 0 ? 90 : 65}
              rx="6"
              fill={i === 2 ? "#D9A441" : "#1E4C7C"}
              opacity={i === 2 ? 1 : 0.55}
            />
          ))}
        </svg>

        <div className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-ink-light/30 blur-3xl" />
        <p className="relative z-10 text-xs text-paper/50">Wilayah Jaya Raya · DKI Jakarta</p>
      </div>

      {/* Form login */}
      <div className="flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-ink">Masuk</h2>
          <p className="mt-1 text-slate-soft text-sm">
            Gunakan akun yang telah didaftarkan oleh Admin TU.
          </p>

          <label className="block mt-6 text-sm font-medium text-ink">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-card border border-ink/15 px-3 py-2 text-sm focus:border-ink-light outline-none"
            placeholder="nama@sdnjatinegara07.sch.id"
          />

          <label className="block mt-4 text-sm font-medium text-ink">Kata sandi</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-card border border-ink/15 px-3 py-2 text-sm focus:border-ink-light outline-none"
            placeholder="••••••••"
          />

          {error && (
            <p className="mt-3 text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-card bg-ink-light py-2.5 text-paper font-semibold text-sm hover:bg-ink transition-colors disabled:opacity-60"
          >
            {loading ? "Memeriksa…" : "Masuk"}
          </button>

          <p className="mt-4 text-xs text-slate-soft">
            Lupa kata sandi? Hubungi Admin TU sekolah untuk reset akun.
          </p>
        </form>
      </div>
    </div>
  );
}
