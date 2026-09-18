"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PeranPengguna } from "@/types/database";
import { LABEL_PERAN } from "@/types/database";

export default function MobileTopBar({
  nama,
  peran,
}: {
  nama: string;
  peran: PeranPengguna;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 bg-ink text-paper">
      <div>
        <p className="text-sm font-semibold leading-tight">{nama}</p>
        <p className="text-xs text-paper/50 leading-tight">{LABEL_PERAN[peran]}</p>
      </div>
      <button
        onClick={handleLogout}
        className="text-xs font-medium text-paper/70 hover:text-gold-soft underline underline-offset-2"
      >
        Keluar
      </button>
    </div>
  );
}
