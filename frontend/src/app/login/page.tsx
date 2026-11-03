"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Lock, Mail, UserRound } from "lucide-react";
import clsx from "clsx";
import { BrandMark } from "@/components/BrandMark";
import { ErrorState } from "@/components/ErrorState";
import { authService } from "@/services/api/services";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (mode === "register") {
        if (data.password !== data.confirmPassword) throw new Error("Les mots de passe ne correspondent pas");
        await authService.register(data);
      } else {
        await authService.login(data);
      }
      router.push("/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-soft px-4 py-8 md:grid-cols-[0.9fr_1.1fr] md:p-0">
      <section className="hidden bg-navy p-10 text-white md:grid md:place-items-center">
        <div>
          <BrandMark dark />
          <h1 className="mt-10 max-w-sm text-5xl font-black leading-tight">Force. Discipline. Respect.</h1>
          <p className="mt-5 max-w-sm text-white/75">Un seul espace pour suivre les événements, les directs et les combats du club.</p>
        </div>
      </section>
      <section className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-8 flex justify-center md:hidden"><BrandMark /></div>
        <div className="rounded-lg bg-white p-5 shadow-soft sm:p-8">
          <h2 className="text-center text-2xl font-black text-navy">Bienvenue !</h2>
          <p className="mt-2 text-center text-sm font-semibold text-slate-500">Connectez-vous ou créez votre compte pour continuer.</p>
          <div className="mt-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
            <button onClick={() => setMode("login")} className={tab(mode === "login")}>Se connecter</button>
            <button onClick={() => setMode("register")} className={tab(mode === "register")}>S'inscrire</button>
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field icon={<UserRound size={18} />} name="firstName" placeholder="Prénom" required />
                <Field icon={<UserRound size={18} />} name="lastName" placeholder="Nom" required />
              </div>
            )}
            <Field icon={<Mail size={18} />} name="email" type="email" placeholder="Adresse e-mail" required />
            <Field icon={<Lock size={18} />} name="password" type="password" placeholder="Mot de passe" required minLength={8} endIcon={<Eye size={18} />} />
            {mode === "register" && <Field icon={<Lock size={18} />} name="confirmPassword" type="password" placeholder="Confirmation du mot de passe" required minLength={8} />}
            {mode === "login" && <div className="text-right"><button type="button" className="text-xs font-bold text-navy">Mot de passe oublié ?</button></div>}
            {error && <ErrorState message={error} />}
            <button disabled={loading} className="w-full rounded-md bg-redbrand px-5 py-3 text-sm font-black text-white shadow-soft focus-ring disabled:opacity-60">
              {loading ? "Veuillez patienter..." : mode === "login" ? "Se connecter" : "S'inscrire"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function tab(active: boolean) {
  return clsx("rounded-md px-4 py-3 text-sm font-black focus-ring", active ? "bg-navy text-white shadow" : "text-slate-600");
}

function Field({ icon, endIcon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode; endIcon?: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 focus-within:ring-2 focus-within:ring-redbrand">
      <span className="text-slate-500">{icon}</span>
      <input {...props} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400" />
      {endIcon && <span className="text-slate-400">{endIcon}</span>}
    </label>
  );
}
