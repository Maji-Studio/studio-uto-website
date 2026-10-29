export function parseInjectedEnv(output: string): Map<string, string> {
  const envVars = new Map<string, string>();
  const lines = output.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;

    const opensQuote = rawValue.startsWith('"');
    const closesQuote = rawValue.length > 1 && rawValue.endsWith('"');
    if (opensQuote && !closesQuote) {
      const parts = [rawValue.slice(1)];
      while (++i < lines.length) {
        const next = lines[i].trimEnd();
        if (next.endsWith('"')) {
          parts.push(next.slice(0, -1));
          break;
        }
        parts.push(next);
      }
      envVars.set(key, parts.join("\n"));
      continue;
    }

    envVars.set(key, rawValue.replace(/^["']|["']$/g, ""));
  }

  return envVars;
}
