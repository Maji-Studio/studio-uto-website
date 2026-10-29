import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

export const VAULT = "Environment Variables";
export const ITEM_PREFIX = "studio-uto-website env";
const STDERR_PREVIEW_CHARS = 300;

const MEDIA_POSTFIX_VAR = "NEXT_PUBLIC_MEDIA_POSTFIX";

export const REQUIRED_LOCAL_VARS = new Set([
  "DATABASE_URI",
  "PAYLOAD_SECRET",
  "NEXT_PUBLIC_SERVER_URL",
]);

export const REQUIRED_DEPLOYED_VARS = new Set([
  "DATABASE_URI",
  "PAYLOAD_SECRET",
  "NEXT_PUBLIC_SERVER_URL",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_REGION",
  "S3_ENDPOINT",
]);

export function requiredDeployedVars(itemSuffix: string): Set<string> {
  return itemSuffix === "production"
    ? REQUIRED_DEPLOYED_VARS
    : new Set([...REQUIRED_DEPLOYED_VARS, MEDIA_POSTFIX_VAR]);
}

export function check1PasswordAuth(): void {
  const result = spawnSync("op", ["vault", "get", VAULT], {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) {
    console.error(
      "1Password CLI not found — install with: brew install --cask 1password-cli",
    );
    process.exit(1);
  }
  if (result.status !== 0) {
    const reason = result.stderr?.split("\n")[0] || "unknown error";
    console.error(`Cannot read the 1Password vault "${VAULT}": ${reason}`);
    console.error(
      "Approve the 1Password prompt for this terminal, or run: op signin",
    );
    process.exit(1);
  }
}
const ENV_NAME_RE = /^[A-Z_][A-Z0-9_]*$/;

export interface TemplateEntry {
  name: string;
  opField: string | null;
}

export function parseTemplate(templateFile = ".env.tpl"): TemplateEntry[] {
  const templatePath = join(process.cwd(), templateFile);
  let template: string;
  try {
    template = readFileSync(templatePath, "utf-8");
  } catch (error) {
    throw new Error(
      `Failed to read ${templateFile} at ${templatePath}: ${error}`,
    );
  }

  const entries: TemplateEntry[] = [];
  for (const rawLine of template.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, name, rawValue] = match;
    const value = rawValue.replace(/^["']|["']$/g, "");
    const opMatch = value.match(/^op:\/\/[^/]+\/[^/]+\/(.+)$/);
    entries.push({ name, opField: opMatch ? opMatch[1] : null });
  }
  return entries;
}

export function templateOpFieldNames(templateFile = ".env.tpl"): Set<string> {
  return new Set(
    parseTemplate(templateFile)
      .filter((e) => e.opField !== null)
      .map((e) => e.opField as string),
  );
}

export function fetchItemFieldNames(env: string): Set<string> {
  const itemName = `${ITEM_PREFIX} ${env}`;
  const result = spawnSync(
    "op",
    ["item", "get", itemName, "--vault", VAULT, "--format", "json"],
    { encoding: "utf-8" },
  );
  if (result.status !== 0) {
    throw new Error(
      `Failed to read 1Password item "${itemName}": ${
        result.stderr?.substring(0, STDERR_PREVIEW_CHARS) || "unknown error"
      }`,
    );
  }

  let parsed: { fields?: Array<{ label?: string }> };
  try {
    parsed = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(
      `Failed to parse 1Password response for "${itemName}": ${error}`,
    );
  }

  const names = new Set<string>();
  for (const field of parsed.fields ?? []) {
    const label = field.label ?? "";
    if (ENV_NAME_RE.test(label)) names.add(label);
  }
  return names;
}

export interface FilterTemplateResult {
  filtered: string;
  skipped: string[];
  missingRequired: string[];
}

export function filterTemplateToItem(
  template: string,
  itemFields: Set<string>,
  required: Set<string>,
): FilterTemplateResult {
  const skipped: string[] = [];
  const missingRequired: string[] = [];

  const lines = template.split("\n").map((rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) return rawLine;

    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!match) return rawLine;

    const [, name, rawValue] = match;
    const value = rawValue.replace(/^["']|["']$/g, "");
    const opMatch = value.match(/^op:\/\/[^/]+\/[^/]+\/(.+)$/);
    if (!opMatch || itemFields.has(opMatch[1])) return rawLine;

    if (required.has(name)) {
      missingRequired.push(name);
      return rawLine; // kept for the error message; caller aborts before inject
    }
    skipped.push(name);
    return `# ${name} skipped — no "${opMatch[1]}" field in the 1Password item`;
  });

  return { filtered: lines.join("\n"), skipped, missingRequired };
}
