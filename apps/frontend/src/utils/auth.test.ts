import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthCookie, hashUserId, removeAuthCookie, setAuthCookie } from "./auth";

describe("hashUserId", () => {
  it("returns a 32-character hex string", async () => {
    const hash = await hashUserId("user@example.com");
    expect(hash).toMatch(/^[a-f0-9]{32}$/);
    expect(hash).toHaveLength(32);
  });

  it("is deterministic for same input", async () => {
    const a = await hashUserId("alice");
    const b = await hashUserId("alice");
    expect(a).toBe(b);
  });

  it("differs for different inputs", async () => {
    const a = await hashUserId("alice");
    const b = await hashUserId("bob");
    expect(a).not.toBe(b);
  });

  it("normalizes input (lowercase, trim)", async () => {
    const a = await hashUserId("  User@Example.COM  ");
    const b = await hashUserId("user@example.com");
    expect(a).toBe(b);
  });
});

describe("setAuthCookie and document.cookie", () => {
  const originalCookieDesc = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");

  beforeEach(() => {
    let cookieStore = "";
    Object.defineProperty(document, "cookie", {
      get() {
        return cookieStore;
      },
      set(value: string) {
        const [part] = value.split(";");
        const [name, ...v] = part.split("=");
        const val = v.join("=").trim();
        if (val === "" || value.includes("expires=Thu, 01 Jan 1970")) {
          cookieStore = cookieStore
            .split("; ")
            .filter((c) => !c.startsWith(`${name}=`))
            .join("; ");
        } else {
          cookieStore = cookieStore ? `${cookieStore}; ${part}` : part;
        }
      },
      configurable: true,
    });
  });

  afterEach(() => {
    if (originalCookieDesc) {
      Object.defineProperty(document, "cookie", originalCookieDesc);
    }
  });

  it("setAuthCookie sets a cookie with the identifier", () => {
    setAuthCookie("user@test.com");
    expect(document.cookie).toContain("flashdrop-auth-identifier=");
    expect(document.cookie).toContain(encodeURIComponent("user@test.com"));
  });

  it("removeAuthCookie clears the auth cookie", () => {
    setAuthCookie("user@test.com");
    expect(document.cookie).not.toBe("");
    removeAuthCookie();
    expect(document.cookie).not.toContain("flashdrop-auth-identifier=user");
  });
});

describe("getAuthCookie", () => {
  it("returns null when cookieStore.get returns undefined", async () => {
    const get = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window, "cookieStore", {
      value: { get },
      configurable: true,
      writable: true,
    });
    const result = await getAuthCookie();
    expect(result).toBeNull();
    expect(get).toHaveBeenCalledWith("flashdrop-auth-identifier");
  });

  it("returns cookie value when present", async () => {
    const get = vi.fn().mockResolvedValue({ value: "user@test.com" });
    Object.defineProperty(window, "cookieStore", {
      value: { get },
      configurable: true,
      writable: true,
    });
    const result = await getAuthCookie();
    expect(result).toBe("user@test.com");
  });
});
