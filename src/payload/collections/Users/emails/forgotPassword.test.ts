import { afterEach, describe, expect, it, vi } from "vitest";
import { forgotPasswordHTML, resetURL } from "./forgotPassword";

afterEach(() => vi.unstubAllEnvs());

describe("forgot password email", () => {
  it("builds an absolute reset link without doubled trailing slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_SERVER_URL", "http://localhost:3060///");
    expect(resetURL("token/with spaces")).toBe(
      "http://localhost:3060/admin/reset/token%2Fwith%20spaces",
    );
    expect(forgotPasswordHTML({ token: "reset-token" })).toContain(
      'href="http://localhost:3060/admin/reset/reset-token"',
    );
  });

  it("escapes the user's name in HTML", () => {
    vi.stubEnv("NEXT_PUBLIC_SERVER_URL", "http://localhost:3060");
    const html = forgotPasswordHTML({
      token: "token",
      user: { name: "<b>\"A&B'</b>" },
    });
    expect(html).toContain("&lt;b&gt;&quot;A&amp;B&#39;&lt;/b&gt;");
    expect(html).not.toContain("<b>");
  });

  it("refuses to build a link without a token", () => {
    vi.stubEnv("NEXT_PUBLIC_SERVER_URL", "http://localhost:3060");
    expect(() => forgotPasswordHTML({})).toThrow(/reset token/);
  });

  it("requires the public server URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SERVER_URL", "");
    expect(() => forgotPasswordHTML({ token: "token" })).toThrow(
      /NEXT_PUBLIC_SERVER_URL/,
    );
  });
});
