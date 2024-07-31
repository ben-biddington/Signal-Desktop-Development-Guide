import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "os";
import { join, normalize } from "path";
import crypto from "crypto";
import { existsSync, readFileSync, readSync, rmdirSync, rmSync } from "node:fs";
import {
  ChildProcess,
  ChildProcessWithoutNullStreams,
  spawn,
} from "node:child_process";
import { timeAction } from "core/timing";
import { waitFor } from "core/waiting";
import process from "node:process";

export type Options = {
  signalSourceDir: string;
  verbose?: boolean;
};

// how/how-to-connect-to-database.md
export const createNewDatabase = async ({
  signalSourceDir,
  verbose = false,
}: Options) => {
  const storagePath = await mkdtemp(
    join(tmpdir(), `signal-test-${crypto.randomUUID()}`)
  );

  if (existsSync(storagePath)) {
    rmdirSync(storagePath);
  }

  console.log(`Running in <${normalize(signalSourceDir)}>`);

  // [!] --password-store="basic" is ignored (i.e., with the quotes)
  // [i] --start-in-tray` prevents window opening, see `how/tests/how-test-electron-works.md`
  const proc = spawn(
    "npm",
    ["run", "start", "--", "--password-store=basic", "--start-in-tray"],
    {
      windowsHide: true,
      cwd: signalSourceDir,
      env: {
        ...process.env,
        NODE_ENV: "development",
        NODE_CONFIG: JSON.stringify({
          storagePath,
        }),
        ELECTRON_ENABLE_LOGGING: "true",
        DISPLAY: ":0",
      },
      shell: process.platform === "win32",
    }
  );

  verbose && addLogging(proc);

  const duration = await timeAction(() =>
    waitFor(() => existsSync(join(storagePath, "config.json")), {
      timeoutMs: 5000,
    })
  );

  console.log(`Database created at <${storagePath}> after <${duration}ms>`);
  console.log(
    "Database encryption key",
    readFileSync(join(storagePath, "config.json")).toString()
  );

  // @todo: this is not working
  proc.kill("SIGTERM");

  process.kill(proc.pid);
};

const addLogging = (proc: ChildProcessWithoutNullStreams) => {
  proc.stdout.setEncoding("utf8");
  proc.stderr.setEncoding("utf8");

  proc.stdout.on("data", (line) => console.log("[stdout.data]", line));
  proc.stdout.on("data", (line) => console.log("[stdout.data]", line));
  proc.stdout.on("error", (line) => console.log("[stdout.error]", line));
  proc.stderr.on("data", (line) => console.log("[stderr.error]", line));
  proc.stderr.on("error", (line) => console.log("[stderr.error]", line));
};
