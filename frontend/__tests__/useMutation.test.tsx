import { act, fireEvent, render, screen } from "@testing-library/react";
import { MutationFeedback } from "@/components/MutationFeedback";
import { SUCCESS_VISIBLE_MS, useMutation } from "@/hooks/useMutation";
import { ApiError } from "@/services/api/client";
import NewEventPage from "@/app/admin/events/new/page";
import { eventService } from "@/services/api/services";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: jest.fn() }), usePathname: () => "/admin/events/new" }));
jest.mock("@/services/session", () => ({
  useCurrentUser: () => ({ status: "authenticated", user: { id: 1, firstName: "A", lastName: "B", email: "a@b.dz", role: "ADMIN", createdAt: "" } }),
  logout: jest.fn()
}));
jest.mock("@/services/api/services", () => ({ eventService: { create: jest.fn() } }));

function Harness({ action }: { action: () => Promise<unknown> }) {
  const m = useMutation();
  return (
    <>
      <button disabled={m.pending} onClick={() => m.run(action, { success: "Enregistré" })}>Go</button>
      <MutationFeedback mutation={m} />
    </>
  );
}

describe("useMutation", () => {
  it("shows the API error message and re-enables the button", async () => {
    render(<Harness action={() => Promise.reject(new ApiError(409, "Ce numéro de combat existe déjà pour cet événement"))} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Go" })); });
    expect(screen.getByRole("alert")).toHaveTextContent("Ce numéro de combat existe déjà pour cet événement");
    expect(screen.getByRole("button", { name: "Go" })).toBeEnabled();
  });

  it("disables while pending and shows success for 3 s", async () => {
    jest.useFakeTimers();
    let resolve: () => void = () => {};
    render(<Harness action={() => new Promise<void>((r) => { resolve = r; })} />);
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(screen.getByRole("button", { name: "Go" })).toBeDisabled();
    await act(async () => { resolve(); });
    expect(screen.getByRole("status")).toHaveTextContent("Enregistré");
    act(() => { jest.advanceTimersByTime(SUCCESS_VISIBLE_MS); });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    jest.useRealTimers();
  });
});

describe("NewEventPage", () => {
  it("shows the server's validation message and stays on the page", async () => {
    (eventService.create as jest.Mock).mockRejectedValue(new ApiError(400, "La date de fin doit être postérieure à la date de début"));
    const { container } = render(<NewEventPage />);
    const form = container.querySelector("form")!;
    for (const [name, value] of [["title", "Open"], ["organizerName", "JCC"], ["location", "OMS"], ["description", "d"],
      ["startDatetime", "2026-12-02T10:00"], ["endDatetime", "2026-12-01T10:00"]]) {
      fireEvent.change(form.querySelector(`[name="${name}"]`)!, { target: { value } });
    }
    await act(async () => { fireEvent.submit(form); });
    expect(screen.getByRole("alert")).toHaveTextContent("La date de fin doit être postérieure à la date de début");
    expect(push).not.toHaveBeenCalled();
  });
});
