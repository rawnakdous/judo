"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, UserRound } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { LoadingState } from "@/components/LoadingState";
import { logout, useCurrentUser } from "@/services/session";
import { roleLabels } from "@/utils/labels";

export default function ProfilePage() {
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
      <h1 className="mb-6 text-3xl font-black text-navy">Profil</h1>
      <section className="max-w-2xl rounded-lg bg-white p-6 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-navy text-white"><UserRound size={34} /></div>
          <div>
            <h2 className="text-2xl font-black text-navy">{user.firstName} {user.lastName}</h2>
            <p className="text-sm font-semibold text-slate-500">{user.email}</p>
            <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-navy">{roleLabels[user.role]}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button onClick={() => router.push("/settings")} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-100 px-4 py-3 text-sm font-black text-navy focus-ring"><Settings size={18} /> Paramètres</button>
          <button onClick={onLogout} className="inline-flex items-center justify-center gap-2 rounded-md bg-redbrand px-4 py-3 text-sm font-black text-white focus-ring"><LogOut size={18} /> Se déconnecter</button>
        </div>
      </section>
    </PageShell>
  );
}
