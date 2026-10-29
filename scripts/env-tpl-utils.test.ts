import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  filterTemplateToItem,
  ITEM_PREFIX,
  parseTemplate,
  REQUIRED_LOCAL_VARS,
  requiredDeployedVars,
  templateOpFieldNames,
} from "./env-tpl-utils";
import { parseInjectedEnv } from "./parseInjectedEnv";

describe("environment templates", () => {
  it("uses the Studio Uto items and declares all deployed variables in both templates", () => {
    expect(ITEM_PREFIX).toBe("studio-uto-website env");
    const deployed = parseTemplate();
    expect(deployed).toHaveLength(10);
    expect(templateOpFieldNames(".env.local.tpl")).toEqual(
      templateOpFieldNames(),
    );
    expect(deployed.every(({ name, opField }) => name === opField)).toBe(true);
    expect(readFileSync(".env.tpl", "utf8")).toContain(
      "op://Environment Variables/studio-uto-website env staging/",
    );
    expect(readFileSync(".env.local.tpl", "utf8")).toContain(
      "op://Environment Variables/studio-uto-website env local/",
    );
  });

  it("only requires the three core local variables and isolates preview media", () => {
    expect([...REQUIRED_LOCAL_VARS]).toEqual([
      "DATABASE_URI",
      "PAYLOAD_SECRET",
      "NEXT_PUBLIC_SERVER_URL",
    ]);
    expect(
      requiredDeployedVars("production").has("NEXT_PUBLIC_MEDIA_POSTFIX"),
    ).toBe(false);
    expect(
      requiredDeployedVars("staging").has("NEXT_PUBLIC_MEDIA_POSTFIX"),
    ).toBe(true);
    expect(requiredDeployedVars("production").has("S3_ENDPOINT")).toBe(true);
  });

  it("skips absent optional references but preserves required failures and literals", () => {
    const template =
      '# comment\nDATABASE_URI="op://Vault/Item/DATABASE_URI"\nS3_BUCKET="op://Vault/Item/bucket"\nLOCAL=literal\n';
    const result = filterTemplateToItem(
      template,
      new Set(),
      REQUIRED_LOCAL_VARS,
    );
    expect(result.missingRequired).toEqual(["DATABASE_URI"]);
    expect(result.skipped).toEqual(["S3_BUCKET"]);
    expect(result.filtered).toContain(
      'DATABASE_URI="op://Vault/Item/DATABASE_URI"',
    );
    expect(result.filtered).toContain("# S3_BUCKET skipped");
    expect(result.filtered).toContain("LOCAL=literal");
    expect(
      filterTemplateToItem(
        template,
        new Set(["DATABASE_URI", "bucket"]),
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
