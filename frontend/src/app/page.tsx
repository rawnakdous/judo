"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { authService } from "@/services/api/services";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await authService.me();
        router.replace("/events");
      } catch {
        router.replace("/login");
      }
    }, 1400);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-navy px-6 text-white">
      <section className="w-full max-w-sm text-center">
        <div className="mx-auto mb-7 flex justify-center">
          <BrandMark dark />
        </div>
        <h1 className="text-4xl font-black leading-tight">JUDO CLUB <span className="block text-redbrand">CONSTANTINE</span></h1>
        <p className="mt-5 text-sm font-semibold text-white/90">Force • Discipline • Respect</p>
        <div className="mx-auto mt-12 h-1 w-40 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-redbrand" />
        </div>
        <p className="mt-6 text-xs font-bold text-white/70">Chargement...</p>
      </section>
    </main>
  );
}
