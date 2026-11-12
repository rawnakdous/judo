import { act, fireEvent, render, screen } from "@testing-library/react";
import AdminAthletesPage from "@/app/admin/athletes/page";
import { ApiError } from "@/services/api/client";
import { athleteService } from "@/services/api/services";
import type { Athlete } from "@/types/domain";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }), usePathname: () => "/admin/athletes" }));
jest.mock("@/services/session", () => ({
  useCurrentUser: () => ({ status: "authenticated", user: { id: 1, firstName: "A", lastName: "B", email: "a@b.dz", role: "ADMIN", createdAt: "" } }),
  logout: jest.fn()
}));
jest.mock("@/services/api/services", () => ({ athleteService: { list: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() } }));
const api = athleteService as jest.Mocked<typeof athleteService>;

const yacine: Athlete = { id: 1, firstName: "Yacine", lastName: "Benali", club: "JS Bordj", country: "Algérie" };

async function flush(ms = 0) {
  await act(async () => { jest.advanceTimersByTime(ms); await Promise.resolve(); await Promise.resolve(); });
}

describe("AdminAthletesPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(window, "confirm").mockReturnValue(true);
    api.list.mockReset().mockResolvedValue([yacine]);
    api.update.mockReset();
    api.delete.mockReset();
  });
  afterEach(() => jest.useRealTimers());

  it("debounces the search: one request 300 ms after typing stops", async () => {
    render(<AdminAthletesPage />);
    await flush();
    expect(api.list).toHaveBeenCalledTimes(1);

    const search = screen.getByRole("searchbox", { name: "Rechercher un athlète" });
    for (const value of ["b", "be", "ben"]) fireEvent.change(search, { target: { value } });
    await flush(299);
    expect(api.list).toHaveBeenCalledTimes(1);
    await flush(1);
    expect(api.list).toHaveBeenCalledTimes(2);
    expect(api.list).toHaveBeenLastCalledWith("ben");
  });

  it("edits an athlete inline", async () => {
    api.update.mockResolvedValue({ ...yacine, club: "JCC" });
    render(<AdminAthletesPage />);
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Modifier Yacine Benali" }));
    const form = screen.getByRole("form", { name: "Modifier Yacine Benali" });
    const club = form.querySelector('input[name="club"]') as HTMLInputElement;
    expect(club.value).toBe("JS Bordj");
    fireEvent.change(club, { target: { value: "JCC" } });
    await act(async () => { fireEvent.submit(form); });
    expect(api.update).toHaveBeenCalledWith(1, { firstName: "Yacine", lastName: "Benali", club: "JCC", country: "Algérie", profileImageUrl: "" });
    expect(screen.getByRole("status")).toHaveTextContent("Yacine Benali modifié");
    expect(screen.queryByRole("form", { name: "Modifier Yacine Benali" })).not.toBeInTheDocument();
  });

  it("explains why an athlete with fights cannot be deleted", async () => {
    api.delete.mockRejectedValue(new ApiError(409, "Impossible de supprimer : cet athlète a des combats"));
    render(<AdminAthletesPage />);
    await flush();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Supprimer Yacine Benali" })); });
    expect(screen.getByRole("alert")).toHaveTextContent("Impossible de supprimer : cet athlète a des combats");
    expect(screen.getByText("Yacine Benali")).toBeInTheDocument();
  });
});
