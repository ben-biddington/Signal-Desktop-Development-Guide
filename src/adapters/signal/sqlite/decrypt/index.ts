import { safeStorage, ipcMain } from "electron";
import path from "path";

const { app, BrowserWindow } = require("electron/main");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      devTools: true,
    },
  });

  console.log("Creating window");

  win.loadFile("index.html");
}

app.on("ready", async () => {
  console.log(`Decrypting with <${safeStorage.getSelectedStorageBackend()}>`);

  const keyValue =
    "763131040b09aa8b854e789cd5bd51b39d3d65e295e7264ef39d2b65c00814591a16ca31469a5ceb57cb41d866ebcf447a66a6d2034d83de2476a6552b2ec2cec51b204ac3937791bb36531c684e16ceb63cf9";

  const encrypted = Buffer.from(keyValue, "hex");

  try {
    const key = safeStorage.decryptString(encrypted);
    console.log({ key });
  } catch (error) {
    console.log({ error });
  }
});
