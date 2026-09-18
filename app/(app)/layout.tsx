import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import MobileTopBar from "@/components/MobileTopBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nama, peran")
    .eq("id", user.id)
    .single();

  const nama = profile?.nama ?? user.email ?? "Pengguna";
  const peran = profile?.peran ?? "guru_piket";

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar nama={nama} peran={peran} />
      <main className="flex-1 pb-16 md:pb-0">
        <MobileTopBar nama={nama} peran={peran} />
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
