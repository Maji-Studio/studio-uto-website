import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  filterTemplateToItem,
  ITEM_PREFIX,
  parseTemplate,
  REQUIRED_LOCAL_VARS,
  REQUIRED_PRODUCTION_VARS,
  templateOpFieldNames,
} from "./env-tpl-utils";
import { parseInjectedEnv } from "./parseInjectedEnv";

describe("environment templates", () => {
  it("uses only the local and production items with their app variables", () => {
    expect(ITEM_PREFIX).toBe("studio-uto-website env");
    const production = parseTemplate();
    const local = parseTemplate(".env.local.tpl");
    expect(production.map(({ name }) => name)).toEqual([
      "DATABASE_URI",
      "PAYLOAD_SECRET",
      "NEXT_PUBLIC_SERVER_URL",
      "MEDIA_DIR",
    ]);
    expect(local.map(({ name }) => name)).toEqual([
      "DATABASE_URI",
      "PAYLOAD_SECRET",
      "NEXT_PUBLIC_SERVER_URL",
    ]);
    expect(production.every(({ name, opField }) => name === opField)).toBe(
      true,
    );
    expect(local.every(({ name, opField }) => name === opField)).toBe(true);
    expect(templateOpFieldNames()).toEqual(REQUIRED_PRODUCTION_VARS);
    expect(templateOpFieldNames(".env.local.tpl")).toEqual(REQUIRED_LOCAL_VARS);
    for (const [file, item] of [
      [".env.tpl", "production"],
      [".env.local.tpl", "local"],
    ]) {
      const refs = readFileSync(file, "utf8").matchAll(
        /op:\/\/[^/]+\/([^/]+)\//g,
      );
      expect([...refs].map((match) => match[1])).toEqual(
        Array(file === ".env.tpl" ? 4 : 3).fill(`${ITEM_PREFIX} ${item}`),
      );
    }
  });

  it("requires the core local variables and the production media directory", () => {
    expect([...REQUIRED_LOCAL_VARS]).toEqual([
      "DATABASE_URI",
      "PAYLOAD_SECRET",
      "NEXT_PUBLIC_SERVER_URL",
    ]);
    expect([...REQUIRED_PRODUCTION_VARS]).toEqual([
      ...REQUIRED_LOCAL_VARS,
      "MEDIA_DIR",
    ]);
    const template = readFileSync(".env.tpl", "utf8");
    expect(
      filterTemplateToItem(
        template,
        REQUIRED_LOCAL_VARS,
        REQUIRED_PRODUCTION_VARS,
      ).missingRequired,
    ).toEqual(["MEDIA_DIR"]);
  });

  it("skips absent optional references but preserves required failures and literals", () => {
    const template =
      '# comment\nDATABASE_URI="op://Vault/Item/DATABASE_URI"\nMEDIA_DIR="op://Vault/Item/mediaDir"\nLOCAL=literal\n';
    const result = filterTemplateToItem(
      template,
      new Set(),
      REQUIRED_LOCAL_VARS,
    );
    expect(result.missingRequired).toEqual(["DATABASE_URI"]);
    expect(result.skipped).toEqual(["MEDIA_DIR"]);
    expect(result.filtered).toContain(
      'DATABASE_URI="op://Vault/Item/DATABASE_URI"',
    );
    expect(result.filtered).toContain("# MEDIA_DIR skipped");
    expect(result.filtered).toContain("LOCAL=literal");
    expect(
      filterTemplateToItem(
        template,
        new Set(["DATABASE_URI", "mediaDir"]),
        REQUIRED_LOCAL_VARS,
      ).filtered,
    ).toBe(template);
  });
});

it("parses injected values including multiline quotes and equals signs", () => {
  expect([
    ...parseInjectedEnv(
      '# comment\nURL="https://example.test/?a=b"\nCERT="first\n  second\nlast"\nEMPTY=\nSINGLE=\'value\'\n',
    ),
  ]).toEqual([
    ["URL", "https://example.test/?a=b"],
    ["CERT", "first\n  second\nlast"],
    ["EMPTY", ""],
    ["SINGLE", "value"],
  ]);
});
