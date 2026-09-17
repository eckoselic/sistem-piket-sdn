"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dasbor" },
  { href: "/presensi", label: "Presensi" },
  { href: "/jadwal", label: "Jadwal" },
  { href: "/jurnal", label: "Jurnal" },
  { href: "/rekap", label: "Rekap" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-ink text-paper border-t border-paper/10 flex z-20">
      {NAV.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 text-center py-3 text-xs font-medium ${
              active ? "text-gold-soft" : "text-paper/55"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
