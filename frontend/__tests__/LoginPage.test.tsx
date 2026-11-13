import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/login/page";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));

describe("LoginPage registration switch", () => {
  const original = process.env.NEXT_PUBLIC_REGISTRATION_ENABLED;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_REGISTRATION_ENABLED;
    else process.env.NEXT_PUBLIC_REGISTRATION_ENABLED = original;
  });

  it("hides the sign-up tab by default", () => {
    delete process.env.NEXT_PUBLIC_REGISTRATION_ENABLED;
    render(<LoginPage />);
    expect(screen.queryByRole("button", { name: "S'inscrire" })).not.toBeInTheDocument();
    expect(screen.getByText("Connectez-vous pour continuer.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeInTheDocument();
  });

  it("shows the sign-up tab when enabled", () => {
    process.env.NEXT_PUBLIC_REGISTRATION_ENABLED = "true";
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: "S'inscrire" })).toBeInTheDocument();
  });
});
