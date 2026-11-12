import { act, fireEvent, render, screen } from "@testing-library/react";
import { AdminMatControl } from "@/components/AdminMatControl";
import { ApiError } from "@/services/api/client";
import { tatamiService } from "@/services/api/services";
import type { Combat, TatamiLive } from "@/types/domain";

jest.mock("@/services/api/services", () => ({ tatamiService: { next: jest.fn() } }));
const next = tatamiService.next as jest.Mock;

const fight = (id: number, a: string, b: string, status: Combat["status"] = "UPCOMING"): Combat => ({
  id, eventId: 1, tatamiId: 9, tatamiNumber: 1, combatNumber: id,
  athlete1: { id: id * 10, firstName: a, lastName: "A", club: "JCC" }, athlete2: { id: id * 10 + 1, firstName: b, lastName: "B", club: "CRB" },
  weightCategory: "-66 kg", ageCategory: "Seniors", status
});
const mat = (current: Combat | null, upcoming: Combat[]): TatamiLive => ({
  tatamiId: 9, number: 1, name: "Tapis 1", liveUrl: null, active: true, currentCombat: current, upcomingCombats: upcoming
});

describe("AdminMatControl", () => {
  beforeEach(() => next.mockReset());

  it("sends the current fight id it shows and applies the new state", async () => {
    const onChange = jest.fn();
    const after = mat(fight(26, "Amir", "Mourad", "IN_PROGRESS"), []);
    next.mockResolvedValue(after);
    render(<AdminMatControl eventId="1" tatami={mat(fight(25, "Yacine", "Rayan", "IN_PROGRESS"), [fight(26, "Amir", "Mourad")])} onChange={onChange} />);

    expect(screen.getByText("Yacine A vs Rayan B")).toBeInTheDocument();
    expect(screen.getByText(/#26 Amir A vs Mourad B/)).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Combat suivant" })); });

    expect(next).toHaveBeenCalledWith("1", 9, 25);
    expect(onChange).toHaveBeenCalledWith(after);
    expect(screen.getByRole("status")).toHaveTextContent("Combat #26 en cours");
  });

  it("sends null when the mat is empty and labels the first start", async () => {
    next.mockResolvedValue(mat(fight(1, "Amir", "Mourad", "IN_PROGRESS"), []));
    render(<AdminMatControl eventId="1" tatami={mat(null, [fight(1, "Amir", "Mourad")])} onChange={jest.fn()} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Démarrer le combat #1" })); });
    expect(next).toHaveBeenCalledWith("1", 9, null);
  });

  it("on 409 shows the server's real state instead of retrying", async () => {
    const onChange = jest.fn();
    const real = mat(fight(26, "Amir", "Mourad", "IN_PROGRESS"), []);
    next.mockRejectedValue(new ApiError(409, "Le tapis a déjà été mis à jour", { status: 409, message: "x", timestamp: "", tatami: real }));
    render(<AdminMatControl eventId="1" tatami={mat(fight(25, "Yacine", "Rayan", "IN_PROGRESS"), [])} onChange={onChange} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Terminer le dernier combat" })); });
    expect(onChange).toHaveBeenCalledWith(real);
    expect(screen.getByRole("status")).toHaveTextContent("Le tapis a déjà été mis à jour");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("is disabled while pending and when nothing is scheduled", async () => {
    let resolve: (t: TatamiLive) => void = () => {};
    next.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { rerender } = render(<AdminMatControl eventId="1" tatami={mat(null, [fight(1, "Amir", "Mourad")])} onChange={jest.fn()} />);
    const button = screen.getByRole("button", { name: "Démarrer le combat #1" });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(next).toHaveBeenCalledTimes(1);
    await act(async () => { resolve(mat(null, [])); });

    rerender(<AdminMatControl eventId="1" tatami={mat(null, [])} onChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Aucun combat prévu" })).toBeDisabled();
  });
});
