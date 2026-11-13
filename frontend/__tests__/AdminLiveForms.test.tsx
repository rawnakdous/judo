import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { AdminCombatForm, nextFreeCombatNumber } from "@/components/admin/AdminCombatForm";
import { AdminCombatList } from "@/components/admin/AdminCombatList";
import { AdminMatSettings } from "@/components/admin/AdminMatSettings";
import { ApiError } from "@/services/api/client";
import { combatService, tatamiService } from "@/services/api/services";
import type { Athlete, Combat, TatamiLive } from "@/types/domain";

jest.mock("@/services/api/services", () => ({ combatService: { create: jest.fn() }, tatamiService: { updateLive: jest.fn() } }));
const create = combatService.create as jest.Mock;
const updateLive = tatamiService.updateLive as jest.Mock;

const athletes: Athlete[] = [
  { id: 1, firstName: "Yacine", lastName: "Benali", club: "JS Bordj" },
  { id: 2, firstName: "Rayan", lastName: "Khelifi", club: "CR Belouizdad" },
  { id: 3, firstName: "Amir", lastName: "Kaci", club: "Judo Club Constantine" }
];
const mat = (id: number, liveUrl: string | null = null): TatamiLive => ({ tatamiId: id, number: id, name: `Tapis ${id}`, liveUrl, active: true, currentCombat: null, upcomingCombats: [] });
const fight = (id: number, number: number, tatamiId: number, status: Combat["status"]): Combat => ({
  id, eventId: 1, tatamiId, tatamiNumber: tatamiId, combatNumber: number, athlete1: athletes[0], athlete2: athletes[1],
  weightCategory: "-66 kg", ageCategory: "Seniors", status
});
const optionLabels = (select: HTMLElement) => within(select).getAllByRole("option").map((o) => o.textContent);

describe("AdminCombatForm", () => {
  beforeEach(() => create.mockReset());

  it("suggests the next free number, never offers the same athlete twice, and sends no status", async () => {
    create.mockResolvedValue({ combatNumber: 8 });
    const onCreated = jest.fn();
    render(<AdminCombatForm eventId="1" tatamis={[mat(1), mat(2)]} athletes={athletes} combats={[fight(1, 3, 1, "FINISHED"), fight(2, 7, 2, "UPCOMING")]} onCreated={onCreated} />);

    expect(screen.getByLabelText(/N° du combat/)).toHaveValue(8);
    fireEvent.change(screen.getByRole("combobox", { name: "Athlète 1" }), { target: { value: "1" } });
    const second = screen.getByRole("combobox", { name: "Athlète 2" });
    expect(optionLabels(second)).not.toContain("Yacine Benali — JS Bordj");

    // search is accent-insensitive and matches clubs
    fireEvent.change(screen.getByRole("searchbox", { name: "Rechercher athlète 2" }), { target: { value: "constantine" } });
    expect(optionLabels(second)).toEqual(["— Choisir —", "Amir Kaci — Judo Club Constantine"]);
    fireEvent.change(second, { target: { value: "3" } });
    fireEvent.change(screen.getByPlaceholderText("-66 kg"), { target: { value: "-73 kg" } });
    fireEvent.change(screen.getByPlaceholderText("Seniors"), { target: { value: "Juniors" } });
    fireEvent.change(screen.getByLabelText(/Début prévu/), { target: { value: "2026-12-20T10:30" } });

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Créer le combat" })); });
    expect(create).toHaveBeenCalledWith({
      eventId: 1, tatamiId: 1, athlete1Id: 1, athlete2Id: 3, combatNumber: 8,
      weightCategory: "-73 kg", ageCategory: "Juniors", scheduledStartTime: "2026-12-20T10:30:00+01:00"
    });
    expect(create.mock.calls[0][0]).not.toHaveProperty("status");
    expect(onCreated).toHaveBeenCalledWith("Combat #8 créé");
  });

  it("shows the API error in the form", async () => {
    create.mockRejectedValue(new ApiError(409, "Ce numéro de combat existe déjà pour cet événement"));
    render(<AdminCombatForm eventId="1" tatamis={[mat(1)]} athletes={athletes} combats={[]} onCreated={jest.fn()} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Athlète 1" }), { target: { value: "1" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Athlète 2" }), { target: { value: "2" } });
    fireEvent.change(screen.getByPlaceholderText("-66 kg"), { target: { value: "-66 kg" } });
    fireEvent.change(screen.getByPlaceholderText("Seniors"), { target: { value: "Seniors" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Créer le combat" })); });
    expect(screen.getByRole("alert")).toHaveTextContent("Ce numéro de combat existe déjà pour cet événement");
  });

  it("computes the next free number", () => {
    expect(nextFreeCombatNumber([])).toBe(1);
    expect(nextFreeCombatNumber([fight(1, 42, 1, "UPCOMING"), fight(2, 5, 1, "UPCOMING")])).toBe(43);
  });
});

describe("AdminCombatList", () => {
  const actions = { start: jest.fn(), finish: jest.fn(), reset: jest.fn(), remove: jest.fn() };

  it("sorts by number and filters by mat and status", () => {
    render(<AdminCombatList tatamis={[mat(1), mat(2)]} actions={actions} combats={[
      fight(1, 30, 2, "UPCOMING"), fight(2, 10, 1, "FINISHED"), fight(3, 20, 1, "UPCOMING")
    ]} />);
    const numbers = () => screen.queryAllByText(/^Combat #\d+/).map((p) => p.textContent?.match(/#(\d+)/)?.[1]);
    expect(numbers()).toEqual(["10", "20", "30"]);
    fireEvent.change(screen.getByLabelText("Filtrer par tapis"), { target: { value: "1" } });
    expect(numbers()).toEqual(["10", "20"]);
    fireEvent.change(screen.getByLabelText("Filtrer par statut"), { target: { value: "UPCOMING" } });
    expect(numbers()).toEqual(["20"]);
    fireEvent.click(screen.getByRole("button", { name: /Démarrer/ }));
    expect(actions.start).toHaveBeenCalledWith(expect.objectContaining({ combatNumber: 20 }));
  });
});

describe("AdminMatSettings", () => {
  beforeEach(() => updateLive.mockReset());

  it("previews the YouTube thumbnail and saves {liveUrl, active}", async () => {
    updateLive.mockResolvedValue({ liveUrl: "https://www.youtube.com/live/abc_DEF-123", active: false });
    const onSaved = jest.fn();
    render(<AdminMatSettings eventId="1" tatami={mat(1)} onSaved={onSaved} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Lien YouTube Live" }), { target: { value: "https://youtu.be/abc_DEF-123" } });
    expect(screen.getByAltText("Aperçu du live Tapis 1").getAttribute("src")).toContain(encodeURIComponent("img.youtube.com/vi/abc_DEF-123"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Live activé" }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Enregistrer" })); });
    expect(updateLive).toHaveBeenCalledWith("1", 1, { liveUrl: "https://youtu.be/abc_DEF-123", active: false });
    expect(screen.getByRole("status")).toHaveTextContent("Réglages enregistrés");
    expect(onSaved).toHaveBeenCalled();
  });

  it("flags non-YouTube links and shows the API message", async () => {
    updateLive.mockRejectedValue(new ApiError(400, "Le lien YouTube Live est invalide"));
    render(<AdminMatSettings eventId="1" tatami={mat(1)} onSaved={jest.fn()} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Lien YouTube Live" }), { target: { value: "https://example.com/x" } });
    expect(screen.getByText(/Collez un lien youtube.com/)).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Enregistrer" })); });
    expect(screen.getByRole("status")).toHaveTextContent("Le lien YouTube Live est invalide");
  });
});
