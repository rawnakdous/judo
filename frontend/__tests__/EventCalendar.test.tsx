import { fireEvent, render, screen, within } from "@testing-library/react";
import { EventCalendar } from "@/components/EventCalendar";
import { eventService } from "@/services/api/services";
import type { Event } from "@/types/domain";

jest.mock("@/services/api/services", () => ({ eventService: { list: jest.fn() } }));
const list = eventService.list as jest.Mock;

const tournoi: Event = {
  id: 7, title: "Tournoi de Noël", description: "", location: "Constantine", organizerName: "JCC", status: "UPCOMING",
  startDatetime: "2026-12-20T09:00:00+01:00", endDatetime: "2026-12-21T18:00:00+01:00"
};

describe("EventCalendar", () => {
  beforeEach(() => list.mockReset().mockResolvedValue([tournoi]));

  it("fetches the visible range and shows multi-day events on each day", async () => {
    render(<EventCalendar month={{ year: 2026, month: 12 }} onMonthChange={jest.fn()} />);
    expect(screen.getByRole("heading", { name: "décembre 2026" })).toBeInTheDocument();
    expect(list).toHaveBeenCalledWith({ from: "2026-11-30", to: "2027-01-03" });

    const chips = await screen.findAllByRole("link", { name: "Tournoi de Noël" });
    expect(chips).toHaveLength(2); // 20 and 21 December
    expect(chips[0]).toHaveAttribute("href", "/events/7");
  });

  it("lists the selected day's events", async () => {
    render(<EventCalendar month={{ year: 2026, month: 12 }} onMonthChange={jest.fn()} />);
    await screen.findAllByRole("link", { name: "Tournoi de Noël" });
    fireEvent.click(screen.getByRole("button", { name: "21, 1 événement" }));
    const heading = screen.getByRole("heading", { name: "lundi 21 décembre" });
    const dayList = heading.nextElementSibling as HTMLElement;
    expect(within(dayList).getByText("Tournoi de Noël")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "22" }));
    expect(screen.getByText("Aucun événement ce jour-là.")).toBeInTheDocument();
  });

  it("navigates between months", async () => {
    const onMonthChange = jest.fn();
    render(<EventCalendar month={{ year: 2026, month: 12 }} onMonthChange={onMonthChange} />);
    await screen.findAllByRole("link", { name: "Tournoi de Noël" });
    fireEvent.click(screen.getByRole("button", { name: "Mois suivant" }));
    expect(onMonthChange).toHaveBeenLastCalledWith({ year: 2027, month: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Mois précédent" }));
    expect(onMonthChange).toHaveBeenLastCalledWith({ year: 2026, month: 11 });
  });
});
