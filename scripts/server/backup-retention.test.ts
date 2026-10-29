import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { selectBackupsToDelete } from "./backup-retention";

const name = (date: string, time = "031500") =>
  `studio-uto-${date}-${time}.tar.gz.age`;

describe("backup retention", () => {
  it("keeps fewer backups than the policy", () => {
    expect(selectBackupsToDelete([name("20261027"), name("20261028")])).toEqual(
      [],
    );
  });

  it("keeps the independent daily, weekly and monthly representatives from 400 days", () => {
    const names = Array.from({ length: 400 }, (_, day) =>
      name(
        new Date(Date.UTC(2026, 0, 1 + day))
          .toISOString()
          .slice(0, 10)
          .replaceAll("-", ""),
      ),
    );
    const expected = [
      "20270129",
      "20270130",
      "20270131",
      "20270201",
      "20270202",
      "20270203",
      "20270204",
      "20270124",
      "20270117",
      "20261231",
      "20261130",
      "20261031",
      "20260930",
      "20260831",
      "20260731",
      "20260630",
      "20260531",
      "20260430",
      "20260331",
    ]
      .map((date) => name(date))
      .sort();
    const deleted = selectBackupsToDelete(names);
    expect(names.filter((entry) => !deleted.includes(entry)).sort()).toEqual(
      expected,
    );
    expect(expected).toHaveLength(19);
    expect(expected.length).toBeLessThanOrEqual(23);
    expect(deleted).toEqual([...deleted].sort());
  });

  it("keeps only the newest backup within one day, including duplicate inputs", () => {
    const older = name("20261029", "010000");
    const newest = name("20261029", "230000");
    expect(selectBackupsToDelete([older, newest, older, newest])).toEqual([
      older,
    ]);
  });

  it("uses ISO weeks across the week-year boundary", () => {
    expect(
      selectBackupsToDelete(
        [name("20261231"), name("20270101"), name("20270104")],
        { daily: 0, weekly: 2, monthly: 0 },
      ),
    ).toEqual([name("20261231")]);
  });

  it("counts months with backups across a three-month gap", () => {
    expect(
      selectBackupsToDelete(
        [name("20260415"), name("20260715"), name("20261030")],
        { daily: 1, weekly: 1, monthly: 3 },
      ),
    ).toEqual([]);
  });

  it("never deletes unrelated names or invalid dates", () => {
    const ignored = [
      "notes.txt",
      name("20261301"),
      name("20260230"),
      name("20260229"),
      name("20261029", "250000"),
      name("20261029", "236000"),
      "studio-uto-20261029-031500.tar.gz",
      "prefix-" + name("20261029"),
    ];
    expect(selectBackupsToDelete([...ignored, name("20240229")])).toEqual([]);
  });

  it("runs the CLI with plain Node and ignores blank lines", () => {
    const older = name("20261029", "010000");
    const result = spawnSync(
      process.execPath,
      ["--no-warnings", "scripts/server/backup-retention.ts"],
      {
        input: `${older}\n\n${name("20261029", "230000")}\nother\n${older}\n`,
        encoding: "utf8",
      },
    );
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe(`${older}\n`);
  });
});
