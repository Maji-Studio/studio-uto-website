export function assertSeedDatabase(
  uri: string | undefined,
  allowRemote?: string,
): void {
  if (!uri) throw new Error("DATABASE_URI is required to seed content.");
  if (allowRemote === "true") return;
  const authority = /^mongodb:\/\/([^/?#]+)/.exec(uri)?.[1];
  const hosts = authority?.slice(authority.lastIndexOf("@") + 1).split(",");
  if (
    !hosts?.length ||
    !hosts.every((host) => /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host))
  ) {
    throw new Error(
      "Seed refused: use localhost/127.0.0.1 or explicitly set SEED_ALLOW_REMOTE=true.",
    );
  }
}
