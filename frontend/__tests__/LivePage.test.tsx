import { act, fireEvent, render, screen, within } from "@testing-library/react";
import LivePage from "@/app/events/[id]/live/page";
import { FightSelector } from "@/components/LiveComponents";
import { LiveFreshness } from "@/components/LiveFreshness";
import { eventService } from "@/services/api/services";
import type { Combat, EventLive, TatamiLive } from "@/types/domain";

const replace = jest.fn();
let search = "";
jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
  usePathname: () => "/events/1/live",
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(search)
}));
jest.mock("@/services/session", () => ({ useCurrentUser: () => ({ status: "anonymous" }) }));
jest.mock("@/services/api/services", () => ({ eventService: { live: jest.fn() } }));
const live = eventService.live as jest.Mock;

const athlete = (id: number, firstName: string, lastName: string) => ({ id, firstName, lastName, club: "JCC" });
const combat = (id: number, tatamiId: number, a: string, b: string): Combat => ({
  id, eventId: 1, tatamiId, tatamiNumber: tatamiId, combatNumber: id, athlete1: athlete(id * 10, a, "A"), athlete2: athlete(id * 10 + 1, b, "B"),
  weightCategory: "-66 kg", ageCategory: "Seniors", status: "IN_PROGRESS"
});
const mat = (id: number, current: Combat | null, active = true): TatamiLive => ({
  tatamiId: id, number: id, name: `Tapis ${id}`, liveUrl: `https://www.youtube.com/live/video${id}xx`, active, currentCombat: current, upcomingCombats: []
});
const snapshot = (tatamis: TatamiLive[], status: "LIVE" | "UPCOMING" = "LIVE"): EventLive => ({
  event: { id: 1, title: "Championnat", description: "", location: "", organizerName: "", startDatetime: "", endDatetime: "", status },
  tatamis,
  generatedAt: new Date().toISOString()
});

describe("FightSelector", () => {
  it("shows the fight on each mat, or a waiting message", () => {
    const onSelect = jest.fn();
    render(<FightSelector tatamis={[mat(1, combat(1, 1, "Yacine", "Rayan")), mat(2, null)]} selectedId={1} onSelect={onSelect} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveTextContent("Yacine A vs Rayan B");
    expect(tabs[0]).toHaveTextContent("-66 kg");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveTextContent("En attente du prochain combat");
    fireEvent.click(tabs[1]);
    expect(onSelect).toHaveBeenCalledWith(2);
  });
});

describe("LiveFreshness", () => {
  it("shows the age, then a warning once the data is older than 60 s", () => {
    jest.useFakeTimers();
    render(<LiveFreshness snapshotAt={Date.now()} refreshFailed={false} />);
    expect(screen.getByRole("status")).toHaveTextContent("Mis à jour il y a 0 s");
    act(() => { jest.advanceTimersByTime(61_000); });
    expect(screen.getByRole("status")).toHaveTextContent("Connexion instable");
    jest.useRealTimers();
  });

  it("warns immediately when the last refresh failed", () => {
    render(<LiveFreshness snapshotAt={Date.now()} refreshFailed />);
    expect(screen.getByRole("status")).toHaveTextContent("Connexion instable");
  });
});

describe("LivePage", () => {
  beforeEach(() => { live.mockReset(); replace.mockReset(); search = ""; });

  it("lists only active mats, counts them, and selects from ?tapis=", async () => {
    search = "tapis=2";
    live.mockResolvedValue(snapshot([mat(1, combat(1, 1, "Yacine", "Rayan")), mat(2, combat(2, 2, "Amir", "Mourad")), mat(3, null, false)]));
    render(<LivePage />);
    expect(await screen.findByRole("heading", { name: "2 tapis en direct" })).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTitle("YouTube Live")).toHaveAttribute("src", expect.stringContaining("/embed/video2xx"));

    fireEvent.click(tabs[0]);
    expect(replace).toHaveBeenCalledWith("/events/1/live?tapis=1", { scroll: false });
  });

  it("explains when the event is not live", async () => {
    live.mockResolvedValue(snapshot([], "UPCOMING"));
    render(<LivePage />);
    expect(await screen.findByRole("heading", { name: "Le live n'a pas encore commencé" })).toBeInTheDocument();
  });

  it("keeps the last data and warns when a refresh fails", async () => {
    jest.useFakeTimers();
    live.mockResolvedValueOnce(snapshot([mat(1, combat(1, 1, "Yacine", "Rayan"))])).mockRejectedValue(new Error("Réseau indisponible"));
    render(<LivePage />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByRole("heading", { name: "1 tapis en direct" })).toBeInTheDocument();

    await act(async () => { jest.advanceTimersByTime(10_000); await Promise.resolve(); });
    // a single active mat needs no selector: the current fight panel shows it
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Combat en cours" })).getByText("Yacine A")).toBeInTheDocument();
    expect(screen.getByText(/Connexion instable/)).toBeInTheDocument();
    jest.useRealTimers();
  });
});
