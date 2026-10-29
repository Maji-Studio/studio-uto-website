import { spawnSync } from "child_process";
import { pathToFileURL } from "url";
import { ITEM_PREFIX, check1PasswordAuth } from "./env-tpl-utils";
import {
  fetchFromOnePassword,
  warnUntrackedOnePasswordVars,
} from "./env-deployed-source";

const VALUE_PREVIEW_CHARS = 50;
const CONFIRM_KEYS = new Set(["\r", "\n"]);
const CANCELLED_EXIT_CODE = 130;
interface CliFlags {
  opEnv: string;
  vercelEnv: string;
  dryRun: boolean;
  yes: boolean;
  revealValues: boolean;
}
interface EnvVar {
  name: string;
  value: string;
  isSecret: boolean;
}

function parseFlags(): CliFlags {
  const args = process.argv.slice(2);
  let opEnv = "prod";
  let vercelEnv = "production";
  let dryRun = false;
  let yes = false;
  let revealValues = false;

  for (const arg of args) {
    if (arg.startsWith("--1p-env=")) {
      opEnv = arg.split("=")[1];
    } else if (arg.startsWith("--vercel-env=")) {
      vercelEnv = arg.split("=")[1];
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--yes" || arg === "-y") {
      yes = true;
    } else if (arg === "--reveal-values") {
      revealValues = true;
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else {
      console.error(`Unknown flag: ${arg}`);
      printUsage();
      process.exit(1);
    }
  }

  if (!["prod", "staging", "production"].includes(opEnv)) {
    console.error(
      `Invalid --1p-env: ${opEnv} (must be prod, staging, or production)`,
    );
    process.exit(1);
  }

  if (!["production", "preview"].includes(vercelEnv)) {
    console.error(
      `Invalid --vercel-env: ${vercelEnv} (must be production or preview)`,
    );
    process.exit(1);
  }

  const normalizedOpEnv = opEnv === "prod" ? "production" : opEnv;
  const expectedOpEnv = vercelEnv === "preview" ? "staging" : "production";
  if (normalizedOpEnv !== expectedOpEnv) {
    console.error(
      `Invalid environment mapping: --vercel-env=${vercelEnv} must use --1p-env=${expectedOpEnv}`,
    );
    process.exit(1);
  }

  return { opEnv, vercelEnv, dryRun, yes, revealValues };
}

function printUsage() {
  console.log(`
Sync environment variables from 1Password to Vercel

Usage:
  pnpm env:prod                    Sync prod -> production
  pnpm env:preview                 Sync staging -> preview
  pnpm env:vercel                  Sync production + preview

Advanced:
  tsx scripts/sync-env-to-vercel.ts --dry-run --1p-env=prod
  tsx scripts/sync-env-to-vercel.ts --yes    Skip confirmation (CI/CD)

Flags:
  --1p-env=<prod|staging|production>          1Password item (default: prod)
  --vercel-env=<production|preview>           Vercel environment (default: production)
  --dry-run                                    Preview changes without applying
  --yes, -y                                    Skip confirmation prompt
  --reveal-values                              Show cleartext values for NEXT_PUBLIC_* vars
  --help, -h                                   Show this help message
`);
}

function checkVercelAuth(): void {
  const result = spawnSync("vercel", ["whoami"], { encoding: "utf-8" });

  if (result.error) {
    console.error("Vercel CLI not found");
    console.error("\nInstall with: pnpm add -g vercel");
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error("Not authenticated with Vercel");
    console.error("\nRun: vercel login");
    process.exit(1);
  }

  console.log("  Vercel CLI authenticated");
}

function checkVercelProject(): void {
  const result = spawnSync("test", ["-d", ".vercel"], { encoding: "utf-8" });

  if (result.status !== 0) {
    console.error("Vercel project not linked");
    console.error("\nRun: vercel link");
    process.exit(1);
  }

  console.log("  Vercel project linked");
}

function isPublic(name: string): boolean {
  return name.startsWith("NEXT_PUBLIC_") || name === "NODE_ENV";
}

function uploadToVercel(
  envVars: Map<string, string>,
  vercelEnv: string,
  dryRun: boolean,
  yes: boolean,
  revealValues: boolean,
): void {
  console.log(
    `\n${dryRun ? "Preview" : "Syncing"} to Vercel (${vercelEnv})...`,
  );

  const varsToSync: EnvVar[] = [];
  for (const [name, value] of envVars) {
    if (name === "NODE_ENV") {
      console.log(`  Skipping NODE_ENV (environment-specific)`);
      continue;
    }

    varsToSync.push({
      name,
      value,
      isSecret: !isPublic(name),
    });
  }

  if (varsToSync.length === 0) {
    console.error("No variables to sync");
    process.exit(1);
  }

  console.log(`\nVariables to sync (${varsToSync.length}):`);
  for (const { name, value, isSecret: secret } of varsToSync) {
    const showCleartext = (!secret && revealValues) || isPublic(name);
    const displayValue = showCleartext
      ? value.substring(0, VALUE_PREVIEW_CHARS)
      : "***";
    const truncated =
      showCleartext && value.length > VALUE_PREVIEW_CHARS ? "..." : "";
    console.log(`  ${name} = ${displayValue}${truncated}`);
  }

  if (dryRun) {
    console.log("\nDry-run complete (no changes made)");
    return;
  }

  console.log(
    `\nThis will overwrite existing variables in Vercel ${vercelEnv} environment`,
  );

  if (yes) {
    console.log("Auto-confirming (--yes flag)");
    performSync(varsToSync, vercelEnv);
    return;
  }

  if (!process.stdin.isTTY) {
    console.error(
      "Not running in interactive terminal and --yes flag not provided",
    );
    console.error(
      "Run with --yes flag to skip confirmation in CI/CD environments",
    );
    process.exit(1);
  }

  console.log("Press Enter to continue, or any other key to cancel...");

  const stdin = process.stdin;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf-8");

  stdin.once("data", (key: string) => {
    stdin.setRawMode(false);
    stdin.pause();

    if (!CONFIRM_KEYS.has(key)) {
      console.log("\nCancelled by user");
      process.exit(CANCELLED_EXIT_CODE);
    }

    performSync(varsToSync, vercelEnv);
  });
}

function performSync(varsToSync: EnvVar[], vercelEnv: string): void {
  console.log("\nUploading to Vercel...\n");

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ name: string; error: string }> = [];

  for (const { name, value, isSecret } of varsToSync) {
    const args = buildVercelEnvAddArgs(name, vercelEnv, isSecret);
    const result = spawnSync("vercel", args, {
      input: value,
      encoding: "utf-8",
    });

    if (result.status === 0) {
      console.log(`  ${name} -> ${vercelEnv}`);
      successCount++;
    } else {
      console.error(`  FAILED ${name} -> ${vercelEnv}`);
      errorCount++;
      errors.push({
        name,
        error: `CLI exited with status ${result.status ?? "unknown"} (values withheld)`,
      });
    }
  }

  console.log("\n---");
  console.log(`${successCount} variables synced successfully`);
  if (errorCount > 0) {
    console.log(`${errorCount} variables failed`);
  }
  console.log("---");

  if (errors.length > 0) {
    console.log("\nErrors:");
    for (const { name, error } of errors) {
      console.error(`  ${name}: ${error}`);
    }
  }

  if (errorCount > 0) {
    console.error("\nSync completed with errors");
    process.exit(1);
  } else {
    verifyVercelSync(varsToSync, vercelEnv);
    console.log("\nAll variables synced successfully!");
  }
}

function buildVercelEnvAddArgs(
  name: string,
  vercelEnv: string,
  isSecret: boolean,
): string[] {
  const args = ["env", "add", name, vercelEnv];
  if (vercelEnv === "preview") {
    args.push("");
  }

  args.push("--force", "--yes", isSecret ? "--sensitive" : "--no-sensitive");
  return args;
}

function parseVercelJson(stdout: string): unknown {
  const jsonStart = stdout.indexOf("{");
  if (jsonStart === -1) {
    throw new Error("Vercel CLI did not return JSON");
  }
  return JSON.parse(stdout.slice(jsonStart));
}

function verifyVercelSync(varsToSync: EnvVar[], vercelEnv: string): void {
  console.log(`\nVerifying Vercel ${vercelEnv} environment...`);

  const result = spawnSync(
    "vercel",
    ["env", "ls", vercelEnv, "--format", "json"],
    { encoding: "utf-8" },
  );

  if (result.status !== 0) {
    console.error("Failed to verify Vercel environment variables");
    console.error(result.stderr || result.stdout || "Unknown error");
    process.exit(1);
  }

  let parsed: { envs?: Array<{ key?: string }> };
  try {
    parsed = parseVercelJson(result.stdout) as {
      envs?: Array<{ key?: string }>;
    };
  } catch (error) {
    console.error(`Failed to parse Vercel env list: ${error}`);
    process.exit(1);
  }

  const remoteNames = new Set((parsed.envs ?? []).map((env) => env.key));
  const missing = varsToSync
    .map((envVar) => envVar.name)
    .filter((name) => !remoteNames.has(name));

  if (missing.length > 0) {
    console.error(
      `Vercel ${vercelEnv} verification failed; missing variables: ${missing.join(
        ", ",
      )}`,
    );
    process.exit(1);
  }

  console.log(
    `  Verified ${varsToSync.length} variables in Vercel ${vercelEnv}`,
  );
}

async function main() {
  console.log("Syncing environment variables from 1Password to Vercel\n");

  const flags = parseFlags();

  const itemSuffix = flags.opEnv === "prod" ? "production" : flags.opEnv;
  console.log("Configuration:");
  console.log(`  1Password item: ${ITEM_PREFIX} ${itemSuffix}`);
  console.log(`  Vercel environment: ${flags.vercelEnv}`);
  console.log(`  Dry-run: ${flags.dryRun ? "yes" : "no"}`);

  console.log("\nChecking prerequisites...");

  check1PasswordAuth();
  console.log("  1Password CLI authenticated");
  checkVercelAuth();
  checkVercelProject();

  console.log("All prerequisites met");

  const envVars = fetchFromOnePassword(flags.opEnv);
  warnUntrackedOnePasswordVars(flags.opEnv, new Set(envVars.keys()));

  uploadToVercel(
    envVars,
    flags.vercelEnv,
    flags.dryRun,
    flags.yes,
    flags.revealValues,
  );
}
const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main().catch((error) => {
    console.error("\nUnexpected error:", error);
    process.exit(1);
  });
}
