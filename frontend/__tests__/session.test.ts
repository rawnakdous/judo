import { ApiError } from "@/services/api/client";
import { authService } from "@/services/api/services";
import { __resetSessionForTests, loadSession, setSessionUser } from "@/services/session";
import type { User } from "@/types/domain";

jest.mock("@/services/api/services", () => ({ authService: { me: jest.fn(), logout: jest.fn() } }));
const me = authService.me as jest.Mock;

const admin: User = { id: 1, firstName: "Admin", lastName: "JCC", email: "admin@jcc.dz", role: "ADMIN", createdAt: "2026-01-01T00:00:00Z" };

describe("session store", () => {
  beforeEach(() => {
    __resetSessionForTests();
    me.mockReset();
  });

  it("treats 401 as anonymous", async () => {
    me.mockRejectedValue(new ApiError(401, "Authentification requise"));
    await expect(loadSession()).resolves.toEqual({ status: "anonymous" });
  });

  it("loads the user once and shares it", async () => {
    me.mockResolvedValue(admin);
    const [a, b] = await Promise.all([loadSession(), loadSession()]);
    expect(a).toEqual({ status: "authenticated", user: admin });
    expect(b).toBe(a);
    await loadSession();
    expect(me).toHaveBeenCalledTimes(1);
  });

  it("can be updated after login/logout without refetching", async () => {
    setSessionUser(admin);
    await expect(loadSession()).resolves.toEqual({ status: "authenticated", user: admin });
    setSessionUser(null);
    await expect(loadSession()).resolves.toEqual({ status: "anonymous" });
    expect(me).not.toHaveBeenCalled();
  });
});
