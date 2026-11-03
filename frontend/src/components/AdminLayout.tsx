"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Medal, Radio, Trophy, UsersRound } from "lucide-react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";
import { authService } from "@/services/api/services";

const links = [
  { href: "/admin", label: "Tableau de bord", icon: Trophy },
  { href: "/admin/events", label: "Événements", icon: Medal },
  { href: "/admin/athletes", label: "Athlètes", icon: Radio },
  { href: "/admin/users", label: "Inscriptions", icon: UsersRound }
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    authService.me()
      .then((user) => {
        if (user.role !== "ADMIN") router.replace("/events");
        else setAllowed(true);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function logout() {
    await authService.logout();
    router.push("/login");
  }

  if (!allowed) {
    return <div className="grid min-h-screen place-items-center bg-soft px-4 text-sm font-black text-navy">Vérification des droits...</div>;
  }

  return (
    <div className="min-h-screen bg-soft lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="bg-navy px-4 py-4 text-white lg:min-h-screen lg:p-6">
        <div className="flex items-center justify-between lg:block">
          <BrandMark dark />
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white lg:mt-4 lg:inline-block">ADMIN</span>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto lg:mt-8 lg:block lg:space-y-2" aria-label="Administration">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={clsx("flex shrink-0 items-center gap-2 rounded-md px-3 py-3 text-sm font-bold focus-ring", pathname === href || (href !== "/admin" && pathname.startsWith(href)) ? "bg-redbrand text-white" : "text-white/80 hover:bg-white/10")}>
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="mt-6 hidden items-center gap-2 rounded-md px-3 py-3 text-sm font-bold text-red-200 hover:bg-white/10 focus-ring lg:flex">
          <LogOut size={18} /> Déconnexion
        </button>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
