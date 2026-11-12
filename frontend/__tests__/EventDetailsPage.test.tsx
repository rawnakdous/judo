import { act, fireEvent, render, screen } from "@testing-library/react";
import EventDetailsPage from "@/app/events/[id]/page";
import { ApiError } from "@/services/api/client";
import { eventService, tatamiService } from "@/services/api/services";
import type { Event } from "@/types/domain";

jest.mock("next/navigation", () => ({ useParams: () => ({ id: "5" }), usePathname: () => "/events/5" }));
jest.mock("@/services/session", () => ({ useCurrentUser: () => ({ status: "anonymous" }) }));
jest.mock("@/services/api/services", () => ({ eventService: { get: jest.fn() }, tatamiService: { list: jest.fn() } }));
jest.mock("next/image", () => function Image({ alt }: { alt: string }) { return <span role="img" aria-label={alt} />; });

const get = eventService.get as jest.Mock;
const tatamis = tatamiService.list as jest.Mock;

const base: Event = {
  id: 5, title: "Open de Constantine", description: "Grand tournoi", imageUrl: null, location: "Salle OMS",
  startDatetime: "2026-12-20T09:00:00+01:00", endDatetime: "2026-12-20T18:00:00+01:00", organizerName: "JCC", status: "UPCOMING"
};

describe("EventDetailsPage", () => {
  beforeEach(() => {
    get.mockReset();
    tatamis.mockReset().mockResolvedValue([{}, {}, {}]);
  });

  it("shows details, mats count and a countdown for upcoming events", async () => {
    get.mockResolvedValue(base);
    render(<EventDetailsPage />);
    expect(await screen.findByRole("heading", { name: "Open de Constantine" })).toBeInTheDocument();
    expect(screen.getByText("3 tapis")).toBeInTheDocument();
    expect(screen.getByText("Salle OMS")).toBeInTheDocument();
    expect(screen.getByText(/^Commence /)).toBeInTheDocument();
    expect(document.title).toBe("Open de Constantine · Judo Club Constantine");
  });

  it("shows the watch-live button for live events", async () => {
    get.mockResolvedValue({ ...base, status: "LIVE" });
    render(<EventDetailsPage />);
    const cta = await screen.findByRole("link", { name: /REGARDER LE LIVE/ });
    expect(cta).toHaveAttribute("href", "/events/5/live");
  });

  it("shows a not-found page for unknown events", async () => {
    get.mockRejectedValue(new ApiError(404, "Événement introuvable"));
    render(<EventDetailsPage />);
    expect(await screen.findByRole("heading", { name: "Événement introuvable" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Voir les événements/ })).toHaveAttribute("href", "/events");
  });

  it("copies the link when the share sheet is unavailable", async () => {
    get.mockResolvedValue(base);
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<EventDetailsPage />);
    await screen.findByRole("heading", { name: "Open de Constantine" });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Partager" })); });
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(screen.getByText("Lien copié")).toBeInTheDocument();
  });
});
