import { addMonths, eventsByDay, gridRange, monthGrid, monthLabel, parseMonthKey } from "@/utils/calendar";
import type { Event } from "@/types/domain";

const ev = (id: number, start: string, end: string): Event => ({
  id, title: `E${id}`, description: "", location: "", organizerName: "", status: "UPCOMING", startDatetime: start, endDatetime: end
});

describe("calendar utils", () => {
  it("builds a Monday-first grid with adjacent-month days", () => {
    const weeks = monthGrid({ year: 2026, month: 12 }); // 1 Dec 2026 is a Tuesday
    expect(weeks).toHaveLength(5);
    expect(weeks[0][0]).toEqual({ key: "2026-11-30", day: 30, inMonth: false });
    expect(weeks[0][1]).toEqual({ key: "2026-12-01", day: 1, inMonth: true });
    expect(weeks[4][6]).toEqual({ key: "2027-01-03", day: 3, inMonth: false });
    expect(gridRange({ year: 2026, month: 12 })).toEqual({ from: "2026-11-30", to: "2027-01-03" });
  });

  it("handles 6-week months and February", () => {
    expect(monthGrid({ year: 2026, month: 8 })).toHaveLength(6); // starts on a Saturday, 31 days
    const feb = monthGrid({ year: 2027, month: 2 }); // 1 Feb 2027 is a Monday, 28 days
    expect(feb).toHaveLength(4);
    expect(feb[0][0].key).toBe("2027-02-01");
  });

  it("places multi-day events on every day they cover", () => {
    const map = eventsByDay([ev(1, "2026-11-29T09:00:00+01:00", "2026-12-02T18:00:00+01:00")]);
    expect([...map.keys()]).toEqual(["2026-11-29", "2026-11-30", "2026-12-01", "2026-12-02"]);
  });

  it("uses Africa/Algiers day boundaries", () => {
    // 23:30 UTC on 1 Dec = 00:30 on 2 Dec in Algiers
    const map = eventsByDay([ev(1, "2026-12-01T23:30:00Z", "2026-12-01T23:50:00Z")]);
    expect([...map.keys()]).toEqual(["2026-12-02"]);
  });

  it("parses, shifts and labels months", () => {
    const fallback = { year: 2026, month: 11 };
    expect(parseMonthKey("2027-01", fallback)).toEqual({ year: 2027, month: 1 });
    expect(parseMonthKey("2027-13", fallback)).toBe(fallback);
    expect(parseMonthKey(null, fallback)).toBe(fallback);
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(monthLabel({ year: 2026, month: 12 })).toBe("décembre 2026");
  });
});

describe("eventsByDay with a visible range", () => {
  it("fills every visible day of a season-long event (regression: empty calendar)", () => {
    const season = ev(1, "2025-05-25T09:00:00+01:00", "2027-05-28T17:00:00+01:00");
    const range = gridRange({ year: 2026, month: 11 });
    const map = eventsByDay([season], range);
    expect(map.get("2026-11-12")).toEqual([season]);
    expect(map.size).toBe(42); // 6 weeks, all covered
    expect([...map.keys()][0]).toBe(range.from);
  });
});
