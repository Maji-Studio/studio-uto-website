import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseInjectedEnv } from "./parseInjectedEnv";
import {
  ITEM_PREFIX,
  requiredDeployedVars,
  fetchItemFieldNames,
  filterTemplateToItem,
} from "./env-tpl-utils";

export function fetchFromOnePassword(opEnv: string): Map<string, string> {
  const itemSuffix = opEnv === "prod" ? "production" : opEnv;
  const itemName = `${ITEM_PREFIX} ${itemSuffix}`;
  console.log(`\nFetching from 1Password (${itemName})...`);

  const templatePath = join(process.cwd(), ".env.tpl");
  let template: string;

  try {
    template = readFileSync(templatePath, "utf-8");
  } catch {
    console.error("Failed to read .env.tpl");
    process.exit(1);
  }
  const modifiedTemplate = template.replace(
    new RegExp(
      `${ITEM_PREFIX} (dev|prod|production|staging|\\{\\{ENV\\}\\})`,
      "g",
    ),
    itemName,
  );

  if (!modifiedTemplate.trim()) {
    console.error("Template is empty after modification");
    process.exit(1);
  }
  let injectTemplate = modifiedTemplate;
  try {
    const itemFields = fetchItemFieldNames(itemSuffix);
    const { filtered, skipped, missingRequired } = filterTemplateToItem(
      modifiedTemplate,
      itemFields,
      requiredDeployedVars(itemSuffix),
    );
    if (missingRequired.length > 0) {
      console.error(
        `Required field(s) missing from 1Password item "${itemName}": ` +
          missingRequired.join(", "),
      );
      console.error("Add them to the item before syncing to Vercel.");
      process.exit(1);
    }
    if (skipped.length > 0) {
      console.warn(
        `  ⚠️  Skipping ${skipped.length} optional variable(s) with no field in "${itemName}":`,
      );
      for (const name of skipped) console.warn(`        ${name}`);
    }
    injectTemplate = filtered;
  } catch (error) {
    console.warn(
      `  (Could not pre-check item fields, falling back to strict inject: ${
        error instanceof Error ? error.message : String(error)
      })`,
    );
  }
  const result = spawnSync("op", ["inject"], {
    input: injectTemplate,
    encoding: "utf-8",
  });
  if (result.status !== 0) {
    console.error("Failed to fetch from 1Password (values withheld)");
    process.exit(1);
  }
  const envVars = parseInjectedEnv(result.stdout);
  console.log(`Fetched ${envVars.size} variables from 1Password`);
  return envVars;
}

export function warnUntrackedOnePasswordVars(
  opEnv: string,
  syncedNames: Set<string>,
): void {
  const itemSuffix = opEnv === "prod" ? "production" : opEnv;
  let itemFields: Set<string>;
  try {
    itemFields = fetchItemFieldNames(itemSuffix);
  } catch (error) {
    console.warn(
      `\n  (Could not check for untracked 1Password vars: ${
        error instanceof Error ? error.message : String(error)
      })`,
    );
    return;
  }

  const untracked = [...itemFields]
    .filter((name) => !syncedNames.has(name))
    .sort();

  if (untracked.length === 0) {
    console.log(
      `\n  .env.tpl covers every field in "${ITEM_PREFIX} ${itemSuffix}" — nothing untracked.`,
    );
    return;
  }

  console.warn(
    `\n  ⚠️  ${untracked.length} variable(s) in 1Password ("${ITEM_PREFIX} ${itemSuffix}") are NOT in .env.tpl`,
  );
  console.warn("      and will NOT be synced to Vercel:");
  for (const name of untracked) console.warn(`        ${name}`);
  console.warn(
    `      To include one, add to .env.tpl:\n` +
      `        NAME="op://Environment Variables/${ITEM_PREFIX} staging/NAME"`,
  );
}
