import { app, ipcMain, dialog, BrowserWindow } from "electron";
import path from "path";
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  win.on("closed", () => {
    win = null;
  });
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  app.quit();
});
ipcMain.handle("showSaveDialog", async () => {
  const { filePath } = await dialog.showSaveDialog({
    filters: [{ name: "Ras Files", extensions: ["ras"] }]
  });
  return filePath;
});
