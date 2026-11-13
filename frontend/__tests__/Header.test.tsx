import { render, screen } from "@testing-library/react";
import { Header } from "@/components/Header";
import type { Session } from "@/services/session";

jest.mock("next/navigation", () => ({ usePathname: () => "/events/3" }));
let session: Session = { status: "loading" };
jest.mock("@/services/session", () => ({ useCurrentUser: () => session }));

const user = { id: 2, firstName: "A", lastName: "B", email: "a@b.dz", createdAt: "2026-01-01T00:00:00Z" };

describe("Header", () => {
  it("anonymous visitors see Connexion, no profile, no admin, no bell", () => {
    session = { status: "anonymous" };
    render(<Header />);
    expect(screen.getAllByRole("link", { name: "Connexion" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Profil" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Admin/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Notifications" })).not.toBeInTheDocument();
  });

  it("logged-in users see Profil instead of Connexion", () => {
    session = { status: "authenticated", user: { ...user, role: "USER" } };
    render(<Header />);
    expect(screen.getAllByRole("link", { name: "Profil" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Connexion" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Admin/ })).not.toBeInTheDocument();
  });

  it("admins also get an Administration link", () => {
    session = { status: "authenticated", user: { ...user, role: "ADMIN" } };
    render(<Header />);
    expect(screen.getAllByRole("link", { name: /Admin/ }).length).toBeGreaterThan(0);
  });

  it("highlights Événements on event sub-pages, once", () => {
    session = { status: "anonymous" };
    render(<Header />);
    const current = screen.getAllByRole("link", { current: "page" });
    expect(current.map((l) => l.textContent)).toEqual(["Événements", "Événements"]); // desktop + bottom nav
  });
});
