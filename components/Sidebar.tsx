"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PeranPengguna } from "@/types/database";
import { LABEL_PERAN } from "@/types/database";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/presensi", label: "Presensi", icon: "check" },
  { href: "/jadwal", label: "Jadwal Piket", icon: "calendar" },
  { href: "/jurnal", label: "Jurnal Kejadian", icon: "book" },
  { href: "/rekap", label: "Rekap Bulanan", icon: "file" },
];

function Icon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  switch (name) {
    case "grid":
      return <svg {...common}><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></svg>;
    case "check":
      return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 12l3 3 7-7" /></svg>;
    case "calendar":
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
    case "book":
      return <svg {...common}><path d="M4 4h11a3 3 0 013 3v13H7a3 3 0 01-3-3V4z" /><path d="M4 4v13a3 3 0 003 3" /></svg>;
    case "file":
      return <svg {...common}><path d="M6 3h9l5 5v13H6z" /><path d="M15 3v5h5" /></svg>;
    default:
      return null;
  }
}

export default function Sidebar({
  nama,
  peran,
}: {
  nama: string;
  peran: PeranPengguna;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-ink text-paper min-h-screen">
      <div className="px-6 pt-7 pb-6 border-b border-paper/10">
        <p className="text-xs tracking-wide text-gold-soft/80">SDN Jatinegara Kaum 07 Pagi</p>
        <p className="mt-1 font-bold">Sistem Piket</p>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-paper/10 text-paper" : "text-paper/60 hover:text-paper hover:bg-paper/5"
              }`}
            >
              {active && (
                <span className="nav-active-indicator absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r bg-gold" />
              )}
              <Icon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-5 border-t border-paper/10">
        <p className="text-sm font-semibold">{nama}</p>
        <p className="text-xs text-paper/50">{LABEL_PERAN[peran]}</p>
        <button
          onClick={handleLogout}
          className="mt-3 text-xs text-paper/60 hover:text-gold-soft underline underline-offset-2"
        >
          Keluar
        </button>
      </div>
    </aside>
  );
}
