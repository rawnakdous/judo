import { fireEvent, render, screen } from "@testing-library/react";
import LoginPage from "@/app/login/page";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));

describe("LoginPage", () => {
  it("toggles password visibility with the eye button", () => {
    render(<LoginPage />);
    const password = screen.getByLabelText("Mot de passe");
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Afficher le mot de passe" }));
    expect(password).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByRole("button", { name: "Masquer le mot de passe" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("no longer shows the unimplemented forgotten-password link", () => {
    render(<LoginPage />);
    expect(screen.queryByText(/Mot de passe oublié/)).not.toBeInTheDocument();
  });
});
