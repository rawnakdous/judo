"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radio, Trophy, UserRound } from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/events", label: "Événements", icon: Trophy },
  { href: "/events", label: "LIVE", icon: Radio },
  { href: "/profile", label: "Profil", icon: UserRound }
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white md:hidden" aria-label="Navigation mobile">
      <div className="grid grid-cols-3">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={label} href={href} className={clsx("flex flex-col items-center gap-1 px-2 py-2 text-xs font-bold focus-ring", pathname.startsWith(href) ? "text-redbrand" : "text-slate-500")}>
            <Icon size={20} aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
