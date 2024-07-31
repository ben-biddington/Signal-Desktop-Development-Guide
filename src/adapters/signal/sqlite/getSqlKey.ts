import { spawn } from "child_process";
import { join } from "path";

export type Options = {
  basePath: string;
  configBasePath: string;
};

/*

  Based on ts/scripts/test-electron.ts

  Looks like you can't read the secrets of another electron program:

  [stdout.data] {
  error: Error: Error while decrypting the ciphertext provided to safeStorage.decryptString.
      at _callee$ (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/decrypt/index.js:34:39)
      at tryCatch (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/decrypt/index.js:7:1062)
      at Generator.<anonymous> (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/decrypt/index.js:7:3008)
      at Generator.next (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/decrypt/index.js:7:1699)
      at asyncGeneratorStep (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/decrypt/index.js:8:70)
      at _next (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/decrypt/index.js:9:163)
      at /home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/decrypt/index.js:9:299
      at new Promise (<anonymous>)
      at App.<anonymous> (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/decrypt/index.js:9:90)
      at App.emit (node:events:519:28)
}


*/
export const getSqlKey = async ({ basePath, configBasePath }: Options) => {
  const ELECTRON = join(
    basePath,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "electron.cmd" : "electron"
  );

  const startupScript =
    "/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/decrypt/index.js";

  console.log(`${ELECTRON} ${startupScript}`);

  const proc = spawn(ELECTRON, [startupScript, "--enable-dev-tools"], {
    cwd: basePath,
    env: {
      ...process.env,
    },
    shell: process.platform === "win32",
  });

  console.log(`Starting in <${basePath}>`);

  proc.stdout.setEncoding("utf8");
  proc.stderr.setEncoding("utf8");

  proc.stdout.on("data", (line) => console.log("[stdout.data]", line));
  proc.stdout.on("data", (line) => console.log("[stdout.data]", line));
  proc.stdout.on("error", (line) => console.log("[stdout.error]", line));
  proc.stderr.on("data", (line) => console.log("[stderr.error]", line));
  proc.stderr.on("error", (line) => console.log("[stderr.error]", line));

  const exitPromise = new Promise<void>((accept, reject) => {
    proc.on("exit", (code, signal) => {
      if (code === 0) {
        accept();
      } else {
        reject(new Error(`Exit code: ${code}`));
      }
    });
  });

  await exitPromise;
};
