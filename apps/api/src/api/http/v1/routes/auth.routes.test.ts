import { describe, expect, it } from "vitest";
import { createApp } from "@/app/index.js";
import { hashUserId } from "@/api/http/v1/middleware/userIdSession.js";

describe("auth routes", () => {
  it("POST /api/v1/auth/login sets cookie and returns hashed userId", async () => {
    const app = await createApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { identifier: "user@example.com" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(body.data.userId).toMatch(/^[a-f0-9]{32}$/);
    expect(body.data.userId).toBe(hashUserId("user@example.com"));
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"]).toContain("flashdrop-user-id=");
  });

  it("POST /api/v1/auth/login rejects empty identifier", async () => {
    const app = await createApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { identifier: "" },
    });
    expect(res.statusCode).toBe(400);
  });
});
