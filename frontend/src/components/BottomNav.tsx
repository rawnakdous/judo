"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, ShieldCheck, Trophy, UserRound } from "lucide-react";
import clsx from "clsx";
import { useCurrentUser } from "@/services/session";
import { isActive } from "@/utils/nav";

export function BottomNav() {
  const pathname = usePathname();
  const session = useCurrentUser();
  const isAdmin = session.status === "authenticated" && session.user.role === "ADMIN";

  const items = [
    { href: "/events", label: "Événements", icon: Trophy },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
    session.status === "authenticated"
      ? { href: "/profile", label: "Profil", icon: UserRound }
      : { href: "/login", label: "Connexion", icon: LogIn }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white md:hidden" aria-label="Navigation mobile">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={isActive(pathname, href) ? "page" : undefined} className={clsx("flex flex-col items-center gap-1 px-2 py-2 text-xs font-bold focus-ring", isActive(pathname, href) ? "text-redbrand" : "text-slate-500")}>
            <Icon size={20} aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
