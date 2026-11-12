"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, ShieldCheck, UserRound } from "lucide-react";
import clsx from "clsx";
import { BrandMark } from "./BrandMark";
import { BottomNav } from "./BottomNav";
import { useCurrentUser } from "@/services/session";
import { isActive } from "@/utils/nav";

export function Header() {
  const pathname = usePathname();
  const session = useCurrentUser();
  const isAdmin = session.status === "authenticated" && session.user.role === "ADMIN";

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/events" aria-label="Accueil événements">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-2 md:flex" aria-label="Navigation principale">
            <NavLink href="/events" active={isActive(pathname, "/events")}>Événements</NavLink>
            {isAdmin && <NavLink href="/admin" active={isActive(pathname, "/admin")}>Administration</NavLink>}
          </nav>
          <div className="flex items-center gap-2">
            {session.status === "authenticated" ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className="rounded-full border border-slate-200 p-2 text-navy focus-ring md:hidden" aria-label="Administration">
                    <ShieldCheck size={20} />
                  </Link>
                )}
                <Link href="/profile" className="rounded-full bg-navy p-2 text-white focus-ring" aria-label="Profil">
                  <UserRound size={20} />
                </Link>
              </>
            ) : session.status === "anonymous" ? (
              <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-bold text-navy focus-ring" aria-label="Connexion">
                <LogIn size={18} /> <span className="hidden sm:inline">Connexion</span>
              </Link>
            ) : (
              <span className="h-9 w-9" aria-hidden />
            )}
          </div>
        </div>
      </header>
      <BottomNav />
    </>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={clsx("rounded-full px-4 py-2 text-sm font-bold focus-ring", active ? "bg-navy text-white" : "text-slate-700 hover:bg-slate-100")}>
      {children}
    </Link>
  );
}
