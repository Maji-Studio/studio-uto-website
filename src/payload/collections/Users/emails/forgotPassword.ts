// Matches the reset email text below ("Er gilt eine Stunde").
export const RESET_LINK_LIFETIME_MS = 60 * 60 * 1000;

const escapeHTML = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );

// Payload builds the reset link from serverURL or a CORS/CSRF-listed Host, and
// this config has neither, so its default link is relative. Build it from the
// site's own URL instead, which also ignores whatever Host the request sent.
export const resetURL = (token: string): string => {
  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!serverURL) {
    throw new Error(
      "NEXT_PUBLIC_SERVER_URL is not set: cannot build the reset link",
    );
  }
  return `${serverURL.replace(/\/+$/, "")}/admin/reset/${encodeURIComponent(token)}`;
};

export const forgotPasswordSubject = (): string =>
  "Passwort für Studio Uto zurücksetzen";

export const forgotPasswordHTML = ({
  token,
  user,
}: { token?: string; user?: { name?: unknown } } = {}): string => {
  const link = escapeHTML(resetURL(String(token)));
  const name = typeof user?.name === "string" ? user.name.trim() : "";
  return [
    `<p>Hallo${name ? ` ${escapeHTML(name)}` : ""},</p>`,
    "<p>Für dein Konto im Admin von Studio Uto wurde ein neues Passwort angefordert. Über diesen Link setzt du es. Er gilt eine Stunde.</p>",
    `<p><a href="${link}">${link}</a></p>`,
    "<p>Hast du das nicht angefordert? Dann ignoriere diese Mail. Dein Passwort bleibt, wie es ist.</p>",
  ].join("\n");
};
