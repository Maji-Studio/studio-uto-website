export function assertSeedDatabase(
  uri: string | undefined,
  allowRemote?: string,
): void {
  if (!uri) throw new Error("DATABASE_URI is required to seed content.");
  if (allowRemote === "true") return;
  if (!uri.startsWith("file:") || !uri.slice(5).trim()) {
    throw new Error(
      "Seed refused: use a local file: URL or explicitly set SEED_ALLOW_REMOTE=true.",
    );
  }
}

export function matchesSeedOriginal(
  originalFilename: string,
  storedFilename: string | null | undefined,
): boolean {
  if (!storedFilename) return false;
  const extensionIndex = originalFilename.lastIndexOf(".");
  const stem = originalFilename.slice(0, extensionIndex);
  const extension = originalFilename.slice(extensionIndex);
  if (!storedFilename.startsWith(stem) || !storedFilename.endsWith(extension)) {
    return false;
  }
  const suffix = storedFilename.slice(stem.length, -extension.length);
  return suffix === "" || /^-\d+$/.test(suffix);
}
