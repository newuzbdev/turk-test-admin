import { describe, expect, it } from "vitest";
import { getAdminRefreshUrl } from "./auth-provider";

describe("admin auth refresh URL", () => {
  it("uses the backend admin refresh endpoint", () => {
    expect(getAdminRefreshUrl("http://127.0.0.1:3000")).toBe(
      "http://127.0.0.1:3000/api/admin/refresh"
    );
  });

  it("avoids a duplicate slash when the API base URL has a trailing slash", () => {
    expect(getAdminRefreshUrl("https://api.turkishmock.uz/")).toBe(
      "https://api.turkishmock.uz/api/admin/refresh"
    );
  });
});
