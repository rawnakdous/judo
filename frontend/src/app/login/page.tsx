"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";
import clsx from "clsx";
import { BrandMark } from "@/components/BrandMark";
import { ErrorState } from "@/components/ErrorState";
import { authService } from "@/services/api/services";
import { setSessionUser } from "@/services/session";

export default function LoginPage() {
  /** Public sign-up is off by default; must match the backend's REGISTRATION_ENABLED. */
  const registrationEnabled = process.env.NEXT_PUBLIC_REGISTRATION_ENABLED === "true";
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
        const { user } = await authService.register(data);
        setSessionUser(user);
        router.push("/events");
      } else {
        const { user } = await authService.login(data);
        setSessionUser(user);
        router.push(user.role === "ADMIN" ? "/admin" : "/events");
      }
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
          <p className="mt-2 text-center text-sm font-semibold text-slate-500">
            {registrationEnabled ? "Connectez-vous ou créez votre compte pour continuer." : "Connectez-vous pour continuer."}
          </p>
          {registrationEnabled && (
            <div className="mt-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
              <button type="button" onClick={() => setMode("login")} className={tab(mode === "login")}>Se connecter</button>
              <button type="button" onClick={() => setMode("register")} className={tab(mode === "register")}>S&apos;inscrire</button>
            </div>
          )}
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field icon={<UserRound size={18} />} name="firstName" placeholder="Prénom" required />
                <Field icon={<UserRound size={18} />} name="lastName" placeholder="Nom" required />
              </div>
            )}
            <Field icon={<Mail size={18} />} name="email" type="email" placeholder="Adresse e-mail" required />
            <PasswordField name="password" placeholder="Mot de passe" />
            {mode === "register" && <PasswordField name="confirmPassword" placeholder="Confirmation du mot de passe" />}
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
      {endIcon}
    </label>
  );
}

function PasswordField({ name, placeholder }: { name: string; placeholder: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      icon={<Lock size={18} />}
      name={name}
      type={visible ? "text" : "password"}
      placeholder={placeholder}
      aria-label={placeholder}
      required
      minLength={8}
      autoComplete={name === "password" ? "current-password" : "new-password"}
      endIcon={
        <button type="button" onClick={() => setVisible((v) => !v)} className="rounded p-1 text-slate-400 hover:text-navy focus-ring"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"} aria-pressed={visible}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      }
    />
  );
}
