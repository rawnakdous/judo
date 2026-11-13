import {
  formatStartsIn,
  formatDate, formatDateRange, formatDateTime, formatShortDate, formatTime,
  fromClubInputValue, toClubDayKey, toClubInputValue
} from "@/utils/dates";

// 23:30 UTC on 1 Dec = 00:30 on 2 Dec in Algiers (UTC+1)
const lateUtc = "2026-12-01T23:30:00Z";

describe("dates (Africa/Algiers)", () => {
  it("formats in club time regardless of the device zone", () => {
    expect(formatDate(lateUtc)).toBe("02 déc. 2026");
    expect(formatShortDate(lateUtc)).toBe("02/12/2026");
    expect(formatTime(lateUtc)).toBe("00:30");
    expect(formatDateTime(lateUtc)).toBe("02/12/2026 00:30");
    expect(toClubDayKey(lateUtc)).toBe("2026-12-02");
  });

  it("uses a 24-hour clock", () => {
    expect(formatTime("2026-12-01T14:05:00+01:00")).toBe("14:05");
  });

  it("collapses same-day ranges", () => {
    expect(formatDateRange("2026-12-10T09:00:00+01:00", "2026-12-10T18:00:00+01:00")).toBe("10 déc. 2026");
    expect(formatDateRange("2026-11-28T09:00:00+01:00", "2026-12-02T18:00:00+01:00")).toBe("28 nov. 2026 - 02 déc. 2026");
  });

  it("round-trips datetime-local inputs in club time", () => {
    expect(toClubInputValue(lateUtc)).toBe("2026-12-02T00:30");
    expect(toClubInputValue(null)).toBe("");
    expect(fromClubInputValue("2026-12-02T00:30")).toBe("2026-12-02T00:30:00+01:00");
    expect(new Date(fromClubInputValue(toClubInputValue(lateUtc))).toISOString()).toBe("2026-12-01T23:30:00.000Z");
  });
});

describe("formatStartsIn", () => {
  const now = "2026-11-12T20:00:00+01:00";
  it("counts club calendar days", () => {
    expect(formatStartsIn("2026-11-13T09:00:00+01:00", now)).toBe("Commence demain");
    expect(formatStartsIn("2026-11-14T09:00:00+01:00", now)).toBe("Commence après-demain");
    expect(formatStartsIn("2026-11-15T09:00:00+01:00", now)).toBe("Commence dans 3 jours");
    expect(formatStartsIn("2026-12-12T09:00:00+01:00", now)).toBe("Commence dans 30 jours");
  });
  it("uses hours and minutes on the same day", () => {
    expect(formatStartsIn("2026-11-12T23:00:00+01:00", now)).toBe("Commence dans 3 heures");
    expect(formatStartsIn("2026-11-12T20:12:00+01:00", now)).toBe("Commence dans 12 minutes");
  });
  it("handles a start in the past", () => {
    expect(formatStartsIn("2026-11-12T19:00:00+01:00", now)).toBe("Commence maintenant");
  });
});
