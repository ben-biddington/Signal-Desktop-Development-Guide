import path from "path";
import os from "os";
import crypto from "crypto";
import fs from "fs";
import { execSync } from "child_process";

// https://github.com/witcher112/electron-app-universal-protocol-client/blob/9645b1636ff90193a63dc678be2b6fa0e0184124/src/index.ts#L179
// See logs in the terminal output, not in Electron window.
export default function register(
  app: Electron.App,
  protocol: string,
  useHack: boolean = true
): void {
  const electronAppMainScriptPath = path.resolve(process.argv[1]);

  if (useHack && os.platform() === "linux") {
    try {
      const electronAppDesktopFileName = `electron-app-universal-protocol-client-${crypto
        .createHash("md5")
        .update(`${process.execPath}${electronAppMainScriptPath}`)
        .digest("hex")}.desktop`;

      const electronAppDesktopFilePath = path.resolve(
        app.getPath("home"),
        ".local",
        "share",
        "applications",
        electronAppDesktopFileName
      );

      fs.mkdirSync(path.dirname(electronAppDesktopFilePath), {
        recursive: true,
      });

      fs.writeFileSync(
        electronAppDesktopFilePath,
        [
          "[Desktop Entry]",
          `Name=Electron (pid: ${process.pid})`,
          `Exec=${process.execPath} ${electronAppMainScriptPath} %u`,
          "Type=Application",
          "Terminal=false",
          `MimeType=x-scheme-handler/${protocol};`,
        ].join("\n")
      );

      execSync(
        `xdg-mime default ${electronAppDesktopFileName} x-scheme-handler/${protocol}`
      );

      console.log(
        `[${__filename}] xdg-mime default ${electronAppDesktopFileName} x-scheme-handler/${protocol}`
      );
    } catch {
      // ignore
    }

    console.log(
      `[${__filename}] setAsDefaultProtocolClient ${protocol} ${process.execPath} ${electronAppMainScriptPath}`
    );

    app.setAsDefaultProtocolClient(protocol, process.execPath, [
      electronAppMainScriptPath,
    ]);
  } else {
    app.setAsDefaultProtocolClient(protocol, process.execPath, []);
  }
}
