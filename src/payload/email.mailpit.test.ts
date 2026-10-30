import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildConfig, getPayload, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Users } from "./collections/Users";
import { createEmailAdapter } from "./email";

const hasMailpit =
  spawnSync("mailpit", ["version", "--no-release-check"], {
    stdio: "ignore",
  }).status === 0;
if (!hasMailpit) console.warn("Mailpit suite skipped: brew install mailpit");

// Hold both ephemeral ports until allocated so they cannot be the same port.
async function freePorts(): Promise<number[]> {
  const servers = [createServer(), createServer()];
  try {
    return await Promise.all(
      servers.map(async (server) => {
        server.listen(0, "127.0.0.1");
        await once(server, "listening");
        const address = server.address();
        if (!address || typeof address === "string")
          throw new Error("No test port");
        return address.port;
      }),
    );
  } finally {
    await Promise.all(
      servers.map(
        (server) =>
          new Promise<void>((resolve, reject) => {
            if (!server.listening) return resolve();
            server.close((error) => (error ? reject(error) : resolve()));
          }),
      ),
    );
  }
}

describe.skipIf(!hasMailpit)("Payload password reset through Mailpit", () => {
  let directory: string | undefined;
  let mailpit: ChildProcess | undefined;
  let payload: Payload | undefined;
  let baseURL: string;
  let spawnError: Error | undefined;

  beforeAll(async () => {
    vi.stubEnv("NEXT_PUBLIC_SERVER_URL", "http://localhost:3060");
    directory = await mkdtemp(path.join(tmpdir(), "studio-uto-email-"));
    const [smtpPort, httpPort] = await freePorts();
    baseURL = `http://127.0.0.1:${httpPort}`;
    mailpit = spawn(
      "mailpit",
      [
        "--smtp",
        `127.0.0.1:${smtpPort}`,
        "--listen",
        `127.0.0.1:${httpPort}`,
        "--database",
        path.join(directory, "mailpit.db"),
        "--disable-version-check",
        "--smtp-disable-rdns",
        "--quiet",
      ],
      {
        // Do not inherit MP_* relay/forward settings from a developer's shell.
        env: { PATH: process.env.PATH, TMPDIR: directory, NODE_ENV: "test" },
        stdio: "ignore",
      },
    );
    mailpit.on("error", (error) => {
      spawnError = error;
    });
    await vi.waitFor(
      async () => {
        if (spawnError) throw spawnError;
        if (mailpit?.exitCode !== null)
          throw new Error("Mailpit exited before readiness");
        const response = await fetch(`${baseURL}/api/v1/messages`, {
          signal: AbortSignal.timeout(1000),
        });
        expect(response.ok).toBe(true);
      },
      { timeout: 10000, interval: 100 },
    );

    payload = await getPayload({
      key: `mailpit-${directory}`,
      config: buildConfig({
        secret: "mailpit-test-only-payload-secret",
        collections: [Users],
        db: sqliteAdapter({
          client: {
            url: pathToFileURL(path.join(directory, "payload.db")).href,
          },
        }),
        email: createEmailAdapter({
          SMTP_HOST: "127.0.0.1",
          SMTP_PORT: String(smtpPort),
          EMAIL_FROM_ADDRESS: "website@studio-uto.test",
        }),
        typescript: { autoGenerate: false },
        telemetry: false,
      }),
    });
  }, 30000);

  afterAll(async () => {
    try {
      await payload?.destroy();
    } finally {
      try {
        if (
          mailpit?.pid &&
          mailpit.exitCode === null &&
          mailpit.signalCode === null
        ) {
          const exited = once(mailpit, "exit");
          const timeout = setTimeout(() => mailpit?.kill("SIGKILL"), 3000);
          try {
            mailpit.kill("SIGTERM");
            await exited;
          } finally {
            clearTimeout(timeout);
          }
        }
      } finally {
        vi.unstubAllEnvs();
        if (directory) await rm(directory, { recursive: true, force: true });
      }
    }
  });

  it("delivers the real Users reset email with its persisted token", async () => {
    const user = await payload!.create({
      collection: "users",
      overrideAccess: true,
      data: {
        email: "reset-user@example.test",
        password: "test-password-only",
        name: "Test User",
      },
    });
    await payload!.forgotPassword({
      collection: "users",
      data: { email: user.email },
    });
    const saved = await payload!.findByID({
      collection: "users",
      id: user.id,
      overrideAccess: true,
      showHiddenFields: true,
    });
    expect(saved.resetPasswordToken).toEqual(expect.any(String));
    expect(saved.resetPasswordToken).not.toBe("");

    const response = await fetch(`${baseURL}/api/v1/messages`);
    expect(response.ok).toBe(true);
    const inbox = await response.json();
    expect(inbox.total).toBe(1);
    expect(inbox.messages).toHaveLength(1);
    const detail = await fetch(
      `${baseURL}/api/v1/message/${inbox.messages[0].ID}`,
    );
    expect(detail.ok).toBe(true);
    const message = await detail.json();
    expect(message.To).toEqual([{ Name: "", Address: user.email }]);
    expect(`${message.From.Name} <${message.From.Address}>`).toBe(
      "Studio Uto <website@studio-uto.test>",
    );
    expect(message.Subject).toBe("Passwort für Studio Uto zurücksetzen");
    expect(message.HTML).toContain(
      `href="http://localhost:3060/admin/reset/${saved.resetPasswordToken}"`,
    );
  }, 15000);
});
