import { fireEvent, render, screen, within } from "@testing-library/react";
import { EventSections, FINISHED_PAGE_SIZE } from "@/components/EventSections";
import type { Event, EventStatus } from "@/types/domain";

let nextId = 1;
function event(title: string, status: EventStatus, start: string): Event {
  return {
    id: nextId++, title, status, description: "d", imageUrl: null, location: "Constantine",
    startDatetime: start, endDatetime: start, organizerName: "JCC"
  };
}

const section = (name: string) => screen.getByRole("region", { name });
const titles = (name: string) => within(section(name)).getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

describe("EventSections", () => {
  it("splits events into live, upcoming (soonest first) and finished (latest first)", () => {
    render(<EventSections events={[
      event("Ancien", "FINISHED", "2025-01-10T09:00:00+01:00"),
      event("Lointain", "UPCOMING", "2027-03-01T09:00:00+01:00"),
      event("Maintenant", "LIVE", "2026-11-12T09:00:00+01:00"),
      event("Récent", "FINISHED", "2026-10-01T09:00:00+01:00"),
      event("Bientôt", "UPCOMING", "2026-12-01T09:00:00+01:00")
    ]} />);

    expect(titles("En direct")).toEqual(["Maintenant"]);
    expect(titles("À venir")).toEqual(["Bientôt", "Lointain"]);
    expect(titles("Terminés")).toEqual(["Récent", "Ancien"]);
    const watch = within(section("En direct")).getByRole("link", { name: /Regarder le live/ });
    expect(watch.getAttribute("href")).toMatch(/^\/events\/\d+\/live$/);
  });

  it("hides empty sections", () => {
    render(<EventSections events={[event("Bientôt", "UPCOMING", "2026-12-01T09:00:00+01:00")]} />);
    expect(screen.queryByRole("region", { name: "En direct" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Terminés" })).not.toBeInTheDocument();
    expect(section("À venir")).toBeInTheDocument();
  });

  it("shows a friendly message when there are no events", () => {
    render(<EventSections events={[]} />);
    expect(screen.getByText(/Aucun événement pour le moment/)).toBeInTheDocument();
  });

  it("limits finished events and reveals more on demand", () => {
    const finished = Array.from({ length: FINISHED_PAGE_SIZE + 2 }, (_, i) =>
      event(`Passé ${i}`, "FINISHED", `2025-0${(i % 9) + 1}-01T09:00:00+01:00`));
    render(<EventSections events={finished} />);
    expect(titles("Terminés")).toHaveLength(FINISHED_PAGE_SIZE);
    fireEvent.click(screen.getByRole("button", { name: "Afficher plus (2)" }));
    expect(titles("Terminés")).toHaveLength(FINISHED_PAGE_SIZE + 2);
    expect(screen.queryByRole("button", { name: /Afficher plus/ })).not.toBeInTheDocument();
  });
});
