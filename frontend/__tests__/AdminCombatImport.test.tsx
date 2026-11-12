import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { AdminCombatImport } from "@/components/admin/AdminCombatImport";
import { ApiError, apiFetch } from "@/services/api/client";
import { combatService } from "@/services/api/services";

jest.mock("@/services/api/services", () => ({ combatService: { importCsv: jest.fn() } }));
const importCsv = combatService.importCsv as jest.Mock;
const csv = () => new File(["combat_number,..."], "combats.csv", { type: "text/csv" });

function choose(file: File) {
  fireEvent.change(screen.getByLabelText("Fichier CSV des combats"), { target: { files: [file] } });
}

describe("AdminCombatImport", () => {
  beforeEach(() => importCsv.mockReset());

  it("offers the template and imports the chosen file", async () => {
    importCsv.mockResolvedValue({ created: 42, athletesCreated: 17 });
    const onImported = jest.fn();
    render(<AdminCombatImport eventId="1" onImported={onImported} />);
    expect(screen.getByRole("link", { name: /Télécharger le modèle/ })).toHaveAttribute("href", "/modele-import-combats.csv");
    expect(screen.getByRole("button", { name: "Importer" })).toBeDisabled();

    const file = csv();
    choose(file);
    expect(screen.getByText("combats.csv")).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Importer" })); });
    expect(importCsv).toHaveBeenCalledWith("1", file);
    expect(screen.getByRole("status")).toHaveTextContent("42 combats créés, 17 athlètes créés");
    expect(onImported).toHaveBeenCalled();
  });

  it("lists row errors when the file is rejected", async () => {
    importCsv.mockRejectedValue(new ApiError(400, "2 lignes invalides : aucun combat importé", {
      status: 400, message: "2 lignes invalides : aucun combat importé", timestamp: "",
      errors: [{ row: 3, message: "tapis 9 inexistant pour cet événement" }, { row: 5, message: "catégorie d'âge manquant(e)" }]
    }));
    render(<AdminCombatImport eventId="1" onImported={jest.fn()} />);
    choose(csv());
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Importer" })); });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("2 lignes invalides : aucun combat importé");
    const rows = within(alert).getAllByRole("row").slice(1).map((r) => r.textContent);
    expect(rows).toEqual(["3tapis 9 inexistant pour cet événement", "5catégorie d'âge manquant(e)"]);
  });
});

describe("apiFetch", () => {
  it("does not force a JSON content type on file uploads", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve("{}") });
    global.fetch = fetchMock as unknown as typeof fetch;
    const body = new FormData();
    body.append("file", csv());
    await apiFetch("/upload", { method: "POST", body });
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("Content-Type");
    await apiFetch("/json", { method: "POST", body: "{}" });
    expect(fetchMock.mock.calls[1][1].headers).toHaveProperty("Content-Type", "application/json");
  });
});
