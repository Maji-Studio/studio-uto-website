import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import { resendAdapter } from "@payloadcms/email-resend";
import type { Config } from "payload";

export function createEmailAdapter(
  env: Record<string, string | undefined> = process.env,
): Config["email"] {
  const { RESEND_API_KEY, SMTP_HOST, EMAIL_FROM_ADDRESS } = env;
  if (!RESEND_API_KEY && !SMTP_HOST) {
    if (env.NODE_ENV === "production") {
      throw new Error(
        "Email is not configured: set RESEND_API_KEY or SMTP_HOST, and EMAIL_FROM_ADDRESS in production",
      );
    }
    return undefined;
  }
  if (!EMAIL_FROM_ADDRESS) {
    throw new Error("EMAIL_FROM_ADDRESS is required when email is configured");
  }
  const from = {
    defaultFromAddress: EMAIL_FROM_ADDRESS,
    defaultFromName: env.EMAIL_FROM_NAME || "Studio Uto",
  };
  if (RESEND_API_KEY) {
    return resendAdapter({ apiKey: RESEND_API_KEY, ...from });
  }
  return nodemailerAdapter({
    ...from,
    // Defer connections until sendEmail, rather than probing SMTP at config build.
    skipVerify: true,
    transportOptions: {
      host: SMTP_HOST,
      port: Number(env.SMTP_PORT || 1025),
      secure: false,
      ignoreTLS: true,
    },
  });
}
