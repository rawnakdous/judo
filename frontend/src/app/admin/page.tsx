"use client";

import Link from "next/link";
import { Medal, Radio, Trophy, UsersRound } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";

const cards = [
  { href: "/admin/events", title: "Gestion des événements", icon: Medal },
  { href: "/admin/events", title: "Gestion du Live", icon: Radio },
  { href: "/admin/athletes", title: "Athlètes", icon: Trophy },
  { href: "/admin/users", title: "Inscriptions", icon: UsersRound }
];

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <h1 className="text-3xl font-black text-navy">Tableau de bord</h1>
      <p className="mt-2 text-sm font-semibold text-slate-500">Administration des événements, tapis, combats et utilisateurs.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ href, title, icon: Icon }) => (
          <Link key={title} href={href} className="rounded-lg bg-white p-5 shadow-soft focus-ring">
            <Icon className="text-redbrand" />
            <h2 className="mt-4 text-lg font-black text-navy">{title}</h2>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}
