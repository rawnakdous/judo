"use client";

import { useEffect } from "react";
import { LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { LoadingState } from "@/components/LoadingState";
import { logout, useCurrentUser } from "@/services/session";
import { roleLabels } from "@/utils/labels";

export default function SettingsPage() {
  const session = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (session.status === "anonymous") router.replace("/login");
  }, [session.status, router]);

  async function onLogout() {
    await logout();
    router.push("/events");
  }

  if (session.status !== "authenticated") {
    return <PageShell><LoadingState /></PageShell>;
  }
  const { user } = session;

  return (
    <PageShell>
      <h1 className="mb-6 text-3xl font-black text-navy">Paramètres</h1>
      <section className="max-w-2xl space-y-4">
        <Row icon={<UserRound size={20} />} title="Compte" detail={`${user.firstName} ${user.lastName}`} />
        <Row icon={<Mail size={20} />} title="Adresse e-mail" detail={user.email} />
        <Row icon={<ShieldCheck size={20} />} title="Rôle" detail={roleLabels[user.role]} />
        <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg bg-white p-4 text-left font-black text-redbrand shadow-soft focus-ring"><LogOut size={20} /> Se déconnecter</button>
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
        <p className="truncate text-sm font-semibold text-slate-500">{detail}</p>
      </div>
    </div>
  );
}
