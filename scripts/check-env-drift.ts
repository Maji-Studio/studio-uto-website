import {
  ITEM_PREFIX,
  REQUIRED_LOCAL_VARS,
  requiredDeployedVars,
  VAULT,
  fetchItemFieldNames,
  parseTemplate,
  templateOpFieldNames,
  check1PasswordAuth,
} from "./env-tpl-utils";

const CHECKS = [
  {
    env: "staging",
    templateFile: ".env.tpl",
    required: requiredDeployedVars("staging"),
  },
  {
    env: "production",
    templateFile: ".env.tpl",
    required: requiredDeployedVars("production"),
  },
  {
    env: "local",
    templateFile: ".env.local.tpl",
    required: REQUIRED_LOCAL_VARS,
  },
] as const;

function main(): void {
  console.log("Checking drift between 1Password and the env templates\n");
  check1PasswordAuth();

  let hasBrokenRefs = false;
  let hasUntracked = false;

  for (const { env, templateFile, required } of CHECKS) {
    const template = parseTemplate(templateFile);
    const templateFields = templateOpFieldNames(templateFile);
    const literals = template
      .filter((e) => e.opField === null)
      .map((e) => e.name);

    let itemFields: Set<string>;
    try {
      itemFields = fetchItemFieldNames(env);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
    console.log(
      `── ${templateFile} (${template.length} vars` +
        `${literals.length ? `, ${literals.length} literal: ${literals.join(", ")}` : ""}) ` +
        `↔ 1Password item: ${ITEM_PREFIX} ${env} (${itemFields.size} fields) ──`,
    );

    const untracked = [...itemFields]
      .filter((n) => !templateFields.has(n))
      .sort();
    const missing = [...templateFields]
      .filter((n) => !itemFields.has(n))
      .sort();
    const missingOptional = missing.filter((n) => !required.has(n));
    const missingRequired = missing.filter((n) => required.has(n));

    if (untracked.length > 0) {
      hasUntracked = true;
      console.log(
        `  ⚠️  In 1Password but NOT in ${templateFile} (consider adding):`,
      );
      for (const name of untracked) console.log(`        ${name}`);
    }
    if (missingOptional.length > 0) {
      console.log(
        `  ⚠️  In ${templateFile} but MISSING from 1Password (optional — sync skips with a warning):`,
      );
      for (const name of missingOptional) console.log(`        ${name}`);
    }
    if (missingRequired.length > 0) {
      hasBrokenRefs = true;
      console.log(
        `  ❌  In ${templateFile} but MISSING from 1Password (REQUIRED — sync refuses to run):`,
      );
      for (const name of missingRequired) console.log(`        ${name}`);
    }
    if (untracked.length === 0 && missing.length === 0) {
      console.log("  ✅  In sync");
    }
    console.log("");
  }

  if (hasUntracked) {
    console.log(
      "Add any wanted variables to the matching template as:\n" +
        `  NAME="op://${VAULT}/${ITEM_PREFIX} <env>/NAME"\n` +
        "then run: pnpm env:vercel (.env.tpl) or pnpm env:local (.env.local.tpl)\n",
    );
  }

  if (hasBrokenRefs) {
    console.error(
      "Drift check failed: a template references REQUIRED fields missing from 1Password.",
    );
    process.exit(1);
  }
  console.log("No broken required references.");
}

main();
