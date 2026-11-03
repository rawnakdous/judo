import { Header } from "./Header";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-9">{children}</main>
    </div>
  );
}
