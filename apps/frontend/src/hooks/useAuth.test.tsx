import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./useAuth";

function Consumer() {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ?? "null"}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <button type="button" onClick={() => login("testuser")}>
        Log in
      </button>
      <button type="button" onClick={logout}>
        Log out
      </button>
    </div>
  );
}

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    expect(() => render(<Consumer />)).toThrow("useAuth must be used within an AuthProvider");
  });

  it("provides user and isAuthenticated within AuthProvider", async () => {
    vi.stubGlobal("cookieStore", {
      get: vi.fn().mockResolvedValue(undefined),
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("false");
      expect(screen.getByTestId("user").textContent).toBe("null");
    });

    vi.unstubAllGlobals();
  });
});
