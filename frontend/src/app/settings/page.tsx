"use client";

import { Bell, ChevronRight, Languages, LogOut, Moon, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { authService } from "@/services/api/services";

export default function SettingsPage() {
  const router = useRouter();
  async function logout() {
    await authService.logout();
    router.push("/login");
  }
  return (
    <PageShell>
      <h1 className="mb-6 text-3xl font-black text-navy">Paramètres</h1>
      <section className="max-w-2xl space-y-4">
        <Row icon={<UserRound size={20} />} title="Account" detail="Judo Club Constantine" />
        <Row icon={<Languages size={20} />} title="Language / Langue" detail="Français" />
        <Row icon={<Moon size={20} />} title="Appearance" detail="Mode clair" />
        <Row icon={<Bell size={20} />} title="Notifications" detail="Activées" />
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg bg-white p-4 text-left font-black text-redbrand shadow-soft focus-ring"><LogOut size={20} /> Logout</button>
      </section>
    </PageShell>
  );
}

function Row({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-soft">
      <span className="text-navy">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-black text-navy">{title}</p>
        <p className="text-sm font-semibold text-slate-500">{detail}</p>
      </div>
      <ChevronRight className="text-slate-400" size={18} />
    </div>
  );
}
