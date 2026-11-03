"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogIn, UserRound } from "lucide-react";
import clsx from "clsx";
import { BrandMark } from "./BrandMark";
import { BottomNav } from "./BottomNav";

const nav = [
  { href: "/events", label: "Événements" },
  { href: "/events", label: "LIVE" },
  { href: "/profile", label: "Profil" }
];

export function Header() {
  const pathname = usePathname();
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/events" aria-label="Accueil événements">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-2 md:flex" aria-label="Navigation principale">
            {nav.map((item) => (
              <Link key={item.label} href={item.href} className={clsx("rounded-full px-4 py-2 text-sm font-bold focus-ring", pathname.startsWith(item.href) ? "bg-navy text-white" : "text-slate-700 hover:bg-slate-100")}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button className="hidden rounded-full p-2 text-navy hover:bg-slate-100 focus-ring sm:inline-flex" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <Link href="/profile" className="rounded-full bg-navy p-2 text-white focus-ring" aria-label="Profil">
              <UserRound size={20} />
            </Link>
            <Link href="/login" className="rounded-full border border-slate-200 p-2 text-navy focus-ring" aria-label="Connexion">
              <LogIn size={20} />
            </Link>
          </div>
        </div>
      </header>
      <BottomNav />
    </>
  );
}
