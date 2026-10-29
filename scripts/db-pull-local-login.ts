import { lstatSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

export function assertLocalDatabase(
  uri: string | undefined,
  nodeEnv: string | undefined,
  cwd = process.cwd(),
  repoRoot = root,
): void {
  const refused =
    "Local login reset refused: requires non-production and <repo>/data/payload.db.";
  if (nodeEnv === "production") throw new Error(refused);
  const expected = path.resolve(repoRoot, "data/payload.db");
  const databaseUri = uri || "file:./data/payload.db";
  if (!databaseUri.startsWith("file:")) throw new Error(refused);
  let filename: string;
  try {
    const url = new URL(databaseUri, pathToFileURL(`${cwd}/`));
    if (url.search || url.hash) throw new Error(refused);
    filename = fileURLToPath(url);
  } catch {
    throw new Error(refused);
  }
  if (path.resolve(filename) !== expected) throw new Error(refused);
  // Reject aliases that could make the allowed local path refer to another database.
  for (const entry of [path.dirname(expected), expected]) {
    if (lstatSync(entry, { throwIfNoEntry: false })?.isSymbolicLink()) {
      throw new Error(`${refused} Symlinks are not allowed.`);
    }
  }
}

export async function resetLocalLogins(): Promise<void> {
  assertLocalDatabase(process.env.DATABASE_URI, process.env.NODE_ENV);
  const { getPayload } = await import("payload");
  const { default: config } = await import("../src/payload.config");
  const payload = await getPayload({ config });
  const trusted = {
    overrideAccess: true,
    context: { disableRevalidate: true },
  } as const;
  const password = process.env.DB_PULL_PASSWORD || "uto-local";
  try {
    const { docs } = await payload.find({
      collection: "users",
      pagination: false,
      limit: 0,
      depth: 0,
      sort: "id",
      ...trusted,
    });
    for (const user of docs) {
      await payload.update({
        collection: "users",
        id: user.id,
        data: { password },
        ...trusted,
      });
    }
    console.log(
      `Local login emails: ${docs.map((user) => user.email).join(", ") || "(no users)"}`,
    );
    console.log(`Local login password: ${password}`);
  } finally {
    await payload.destroy();
  }
}

// Payload run imports the script after setting argv[1] to its absolute path.
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await resetLocalLogins();
}
