import { readFileSync } from "node:fs";

const defaultPolicy = { daily: 7, weekly: 4, monthly: 12 };

export function selectBackupsToDelete(
  names: string[],
  policy = defaultPolicy,
): string[] {
  const backups = [...new Set(names)]
    .flatMap((name) => {
      const match =
        /^studio-uto-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})\.tar\.gz\.age$/.exec(
          name,
        );
      if (!match) return [];
      const [, year, month, day, hour, minute, second] = match;
      const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
      const date = new Date(iso);
      if (!Number.isFinite(date.getTime()) || date.toISOString() !== iso)
        return [];
      return [{ name, date }];
    })
    .sort((a, b) => b.name.localeCompare(a.name));

  const kept = new Set(backups.slice(0, 1).map(({ name }) => name));
  const days = new Set<string>();
  const weeks = new Set<string>();
  const months = new Set<string>();
  for (const { name, date } of backups) {
    const iso = date.toISOString();
    // Every ISO week belongs to the year containing its Thursday.
    const thursday = new Date(date);
    thursday.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const periods = [
      [days, iso.slice(0, 10), policy.daily],
      [weeks, thursday.toISOString().slice(0, 10), policy.weekly],
      [months, iso.slice(0, 7), policy.monthly],
    ] as const;
    for (const [seen, period, limit] of periods) {
      if (seen.size < limit && !seen.has(period)) {
        seen.add(period);
        kept.add(name);
      }
    }
  }
  return backups
    .filter(({ name }) => !kept.has(name))
    .reverse()
    .map(({ name }) => name);
}

if (import.meta.main) {
  const names = readFileSync(0, "utf8")
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);
  const deleted = selectBackupsToDelete(names);
  if (deleted.length) process.stdout.write(`${deleted.join("\n")}\n`);
}
