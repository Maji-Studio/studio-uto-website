import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import type { Payload } from "payload";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createEmailAdapter } from "./email";

vi.mock("@payloadcms/email-nodemailer", () => ({
  nodemailerAdapter: vi.fn().mockResolvedValue(() => ({ name: "nodemailer" })),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("email adapter selection", () => {
  it("prefers Resend over SMTP and sends through its HTTP API", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ id: "test-send" }));
    vi.stubGlobal("fetch", fetch);
    const factory = await createEmailAdapter({
      RESEND_API_KEY: "re_test_key",
      SMTP_HOST: "127.0.0.1",
      EMAIL_FROM_ADDRESS: "website@studio-uto.test",
      NODE_ENV: "production",
    });
    const adapter = factory!({ payload: {} as Payload });
    expect(adapter.name).toBe("resend-rest");
    await expect(
      adapter.sendEmail({
        to: "recipient@example.test",
        subject: "Test",
        html: "<p>Test</p>",
      }),
    ).resolves.toEqual({ id: "test-send" });
    expect(nodemailerAdapter).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledExactlyOnceWith(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer re_test_key",
          "Content-Type": "application/json",
        },
        body: expect.any(String),
      },
    );
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
      from: "Studio Uto <website@studio-uto.test>",
      to: "recipient@example.test",
      subject: "Test",
      html: "<p>Test</p>",
    });
  });

  it.each([undefined, "2525"])(
    "uses Mailpit SMTP with port %s",
    async (port) => {
      await createEmailAdapter({
        SMTP_HOST: "127.0.0.1",
        SMTP_PORT: port,
        EMAIL_FROM_ADDRESS: "website@studio-uto.test",
        EMAIL_FROM_NAME: "Custom sender",
      });
      expect(nodemailerAdapter).toHaveBeenCalledExactlyOnceWith({
        defaultFromAddress: "website@studio-uto.test",
        defaultFromName: "Custom sender",
        skipVerify: true,
        transportOptions: {
          host: "127.0.0.1",
          port: port ? 2525 : 1025,
          secure: false,
          ignoreTLS: true,
        },
      });
    },
  );

  it("keeps console fallback outside production", () => {
    expect(createEmailAdapter({ NODE_ENV: "development" })).toBeUndefined();
    expect(createEmailAdapter({ NODE_ENV: "test" })).toBeUndefined();
  });

  it("fails closed in production without a transport", () => {
    expect(() => createEmailAdapter({ NODE_ENV: "production" })).toThrow(
      /RESEND_API_KEY or SMTP_HOST.*EMAIL_FROM_ADDRESS/,
    );
  });

  it.each([{ RESEND_API_KEY: "re_test_key" }, { SMTP_HOST: "127.0.0.1" }])(
    "requires a sender for either transport",
    (env) => {
      expect(() => createEmailAdapter(env)).toThrow(/EMAIL_FROM_ADDRESS/);
      expect(nodemailerAdapter).not.toHaveBeenCalled();
    },
  );

  it("defaults to process.env", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("SMTP_HOST", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => createEmailAdapter()).toThrow(/RESEND_API_KEY or SMTP_HOST/);
  });
});
