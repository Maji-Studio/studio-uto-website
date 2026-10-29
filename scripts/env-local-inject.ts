import { spawnSync } from "child_process";
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  ITEM_PREFIX,
  REQUIRED_LOCAL_VARS,
  fetchItemFieldNames,
  filterTemplateToItem,
  check1PasswordAuth,
} from "./env-tpl-utils";

const TEMPLATE_FILE = ".env.local.tpl";
const OUTPUT_FILE = ".env.local";
const OP_ENV = "local";

function main(): void {
  check1PasswordAuth();

  let template: string;
  try {
    template = readFileSync(join(process.cwd(), TEMPLATE_FILE), "utf-8");
  } catch (error) {
    console.error(`Failed to read ${TEMPLATE_FILE}: ${error}`);
    process.exit(1);
  }

  let itemFields: Set<string>;
  try {
    itemFields = fetchItemFieldNames(OP_ENV);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const { filtered, skipped, missingRequired } = filterTemplateToItem(
    template,
    itemFields,
    REQUIRED_LOCAL_VARS,
  );

  if (missingRequired.length > 0) {
    console.error(
      `Required field(s) missing from 1Password item "${ITEM_PREFIX} ${OP_ENV}": ` +
        missingRequired.join(", "),
    );
    console.error("Add them to the item, then rerun: pnpm env:local");
    process.exit(1);
  }
  const tempFile = join(tmpdir(), `studio-uto-env-local-${process.pid}.tpl`);
  try {
    writeFileSync(tempFile, filtered, "utf-8");
    const result = spawnSync(
      "op",
      ["inject", "-f", "-i", tempFile, "-o", OUTPUT_FILE],
      { stdio: "inherit" },
    );
    if (result.status !== 0) process.exit(result.status ?? 1);
  } finally {
    try {
      unlinkSync(tempFile);
    } catch {}
  }

  if (skipped.length > 0) {
    console.warn(
      `\n⚠️  Skipped ${skipped.length} optional variable(s) — no matching field in ` +
        `"${ITEM_PREFIX} ${OP_ENV}":`,
    );
    for (const name of skipped) console.warn(`     ${name}`);
    console.warn(
      "   The app degrades gracefully without these. To include one, add the field\n" +
        "   to the 1Password item and rerun pnpm env:local (pnpm env:check shows drift).",
    );
  }
  console.log(
    `\nWrote ${OUTPUT_FILE} from ${TEMPLATE_FILE} ("${ITEM_PREFIX} ${OP_ENV}").`,
  );
}

main();
